import * as fs from "fs";
import * as path from "path";
import type { LinterRule, ConsolidatedLinterRule } from "./types";
import { logFileRead, getTitle, getFolders, writeFile } from "./utils";

/**
 * Gets all linter rule markdown files from a directory
 */
async function getLinterRules(dirPath: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  const folders = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        !entry.name.endsWith("index.md"),
    )
    .map((entry) => path.join(dirPath, entry.name));

  return folders;
}

/**
 * Assembles linter rules from the api-linter repository.
 * Structure: docs/rules/XXXX/*.md (multiple files per AEP)
 */
export async function assembleLinterRules(
  linterLocation: string,
): Promise<LinterRule[]> {
  let linterRules = [];
  const linter_rule_folders = await getFolders(
    path.join(linterLocation, "docs/rules/"),
  );
  for (var folder of linter_rule_folders) {
    try {
      const linter_files = await getLinterRules(folder);
      for (var linter_file of linter_files) {
        linterRules.push(
          buildLinterRule(
            linter_file,
            folder.split("/")[folder.split("/").length - 1],
          ),
        );
      }
    } catch (e) {
      console.log(`Linter Rule ${folder} failed with error ${e}`);
    }
  }
  return linterRules;
}

/**
 * Assembles OpenAPI linter rules from the aep-openapi-linter repository.
 *
 * Structure: docs/XXXX.md (one file per AEP)
 * Each file can contain multiple H2 sections, which become separate rules.
 * Content before the first H2 becomes the preamble.
 */
export async function assembleOpenAPILinterRules(
  openapiLinterLocation: string,
): Promise<LinterRule[]> {
  // Defensive check: Verify repository exists
  if (!fs.existsSync(openapiLinterLocation)) {
    console.log("ℹ️  OpenAPI linter repository not found, skipping...");
    console.log(`   Expected location: ${openapiLinterLocation}`);
    return [];
  }

  const docsPath = path.join(openapiLinterLocation, "docs");

  // Defensive check: Verify docs directory exists
  if (!fs.existsSync(docsPath)) {
    console.warn("⚠️  OpenAPI linter docs directory not found");
    console.warn(`   Expected: ${docsPath}`);
    return [];
  }

  let linterRules: LinterRule[] = [];

  try {
    const files = await fs.promises.readdir(docsPath);

    for (const file of files) {
      // Process only numbered AEP files (e.g., 0131.md, 0132.md)
      // Skip index files like rules.md
      if (file.match(/^\d{4}\.md$/)) {
        const filePath = path.join(docsPath, file);
        const aepNumber = file.split(".")[0]; // Extract "0131" from "0131.md"

        try {
          logFileRead(filePath, "OpenAPI Linter rule");
          const fileContents = fs.readFileSync(filePath, "utf-8");

          // Split file by H2 sections (##)
          const h2Pattern = /^## (.+)$/gm;
          const matches = Array.from(fileContents.matchAll(h2Pattern));

          if (matches.length === 0) {
            // No H2 sections found, treat entire file as a single rule
            const rule = buildLinterRule(filePath, aepNumber);
            linterRules.push(rule);
            console.log(
              `✓ Processed OpenAPI linter rule: AEP-${aepNumber} (single rule)`,
            );
          } else {
            // Extract preamble (content before first H2)
            const firstH2Index = matches[0].index!;
            const preamble = fileContents.substring(0, firstH2Index).trim();

            // Split by H2 sections
            for (let i = 0; i < matches.length; i++) {
              const match = matches[i];
              const matchIndex = match.index!;
              const title = match[1];
              const nextMatchIndex =
                i < matches.length - 1
                  ? matches[i + 1].index!
                  : fileContents.length;

              // Extract content for this H2 section
              const sectionContent = fileContents.substring(
                matchIndex,
                nextMatchIndex,
              );

              // Create a slug from the H2 title
              const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");

              // Create a LinterRule for this section
              const ruleContent = `# ${title}\n\n${sectionContent.replace(/^## .+$/m, "").trim()}`;

              linterRules.push({
                title: title,
                aep: aepNumber,
                contents: `---\ntitle: ${title}\n---\n${ruleContent}`,
                filename: `${aepNumber}-${slug}.md`,
                slug: `${aepNumber}-${slug}`,
                preamble: i === 0 ? preamble : undefined, // Add preamble to first rule
              });
            }

            console.log(
              `✓ Processed OpenAPI linter rule: AEP-${aepNumber} (${matches.length} rules)`,
            );
          }
        } catch (error) {
          console.error(`❌ Failed to process ${file}:`, error);
          // Continue processing other files
        }
      }
    }

    console.log(`✓ Assembled ${linterRules.length} OpenAPI linter rules`);
  } catch (error) {
    console.error("❌ Error reading OpenAPI linter docs directory:", error);
    return [];
  }

  return linterRules;
}

/**
 * Builds a single linter rule from a file
 */
export function buildLinterRule(rulePath: string, aep: string): LinterRule {
  logFileRead(rulePath, "Linter rule");
  let contents = fs.readFileSync(rulePath, "utf-8");
  let title = getTitle(contents);

  contents = contents.replace("---", `---\ntitle: ${title}`);

  let filename = rulePath.split("/")[rulePath.split("/").length - 1];

  return {
    title: title,
    aep: aep,
    contents: contents,
    filename: filename,
    slug: filename.split(".")[0],
  };
}

/**
 * Consolidates linter rules by AEP number, with optional preamble text.
 *
 * @param input Object containing linterRules array and optional preamble text
 * @returns Array of consolidated rules grouped by AEP
 */
export function consolidateLinterRule(input: {
  linterRules: LinterRule[];
  preamble?: string;
}): ConsolidatedLinterRule[] {
  const { linterRules, preamble = "" } = input;

  let rules = {};
  for (var rule of linterRules) {
    if (rule.aep in rules) {
      rules[rule.aep].push(rule);
    } else {
      rules[rule.aep] = [rule];
    }
  }

  let consolidated_rules = [];
  for (var key in rules) {
    let rules_contents = rules[key].map(
      (aep) => `<details>
<summary>${aep.title}</summary>
${aep.contents.replace(/---[\s\S]*?---/m, "")}
</details>
`,
    );

    // Extract preamble from first rule if available, otherwise use provided preamble
    const rulePreamble = rules[key][0].preamble || preamble;
    const preambleSection = rulePreamble ? `${rulePreamble}\n\n` : "";
    let contents = `---
title: AEP-${rules[key][0].aep} Linter Rules
---
${preambleSection}${rules_contents.join("\n")}
`;
    consolidated_rules.push({ contents: contents, aep: rules[key][0].aep });
  }
  return consolidated_rules;
}

/**
 * Writes a consolidated rule to disk
 */
export function writeRule(rule: ConsolidatedLinterRule, outputPath?: string) {
  const filePath =
    outputPath ||
    path.join(`src/content/docs/tooling/linter/rules/`, `${rule.aep}.md`);
  writeFile(filePath, rule.contents);
}

/**
 * Writes linter rules as JSON data file for Astro to consume
 * This allows Astro components to render the rules instead of pre-generating markdown
 *
 * @param rules - Array of linter rules to write
 * @param outputPath - Path to write the JSON file
 */
export function writeLinterRulesJSON(
  rules: LinterRule[],
  outputPath: string,
): void {
  // Ensure the directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write the rules as JSON
  writeFile(outputPath, JSON.stringify(rules, null, 2));
  console.log(`✓ Wrote ${rules.length} linter rules to ${outputPath}`);
}

/**
 * Gets unique AEP numbers from linter rules
 * Used for site structure generation
 *
 * @param rules - Array of linter rules
 * @returns Array of unique AEP numbers, sorted
 */
export function getUniqueAeps(rules: LinterRule[]): string[] {
  const aeps = new Set(rules.map((r) => r.aep));
  return Array.from(aeps).sort();
}
