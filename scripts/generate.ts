import * as fs from "fs";
import * as path from "path";

import loadConfigFiles from "./src/config";
import {
  type AEP,
  type ConsolidatedLinterRule,
  type GroupFile,
  type LinterRule,
} from "./src/types";
import { buildMarkdown, Markdown } from "./src/markdown";
import { load, dump } from "js-yaml";
import {
  assembleLinterRules,
  assembleOpenAPILinterRules,
  consolidateLinterRule,
  writeRule,
} from "./src/linter";
import {
  logFileRead,
  logFileWrite,
  getTitle,
  writeFile,
  getFolders,
  copyFile,
} from "./src/utils";
import {
  createEmptySiteStructure,
  addOverviewPage,
  addToolingPage,
  addLinterRules,
  addOpenAPILinterRules,
  addAEPEdition,
  writeSiteStructure,
  type SiteStructure,
} from "../src/utils/site-structure";

const AEP_LOC = process.env.AEP_LOCATION || "";
const AEP_LINTER_LOC = process.env.AEP_LINTER_LOC || "";
const AEP_OPENAPI_LINTER_LOC = process.env.AEP_OPENAPI_LINTER_LOC || "";
const AEP_COMPONENTS = process.env.AEP_COMPONENTS_LOC || "";
const AEP_EDITION_2026 = process.env.AEP_EDITION_2026 || "";

// Logging functions
function logFolderDetection() {
  console.log("=== Folder Detection ===");

  if (AEP_LOC) {
    console.log(`✓ AEP folder found: ${AEP_LOC}`);
    if (fs.existsSync(AEP_LOC)) {
      console.log(`  - Path exists and is accessible`);
    } else {
      console.log(`  - ⚠️  Path does not exist`);
    }
  } else {
    console.log(
      `✗ AEP folder not configured (AEP_LOCATION environment variable)`,
    );
  }

  if (AEP_LINTER_LOC) {
    console.log(`✓ Linter folder found: ${AEP_LINTER_LOC}`);
    if (fs.existsSync(AEP_LINTER_LOC)) {
      console.log(`  - Path exists and is accessible`);
    } else {
      console.log(`  - ⚠️  Path does not exist`);
    }
  } else {
    console.log(
      `✗ Linter folder not configured (AEP_LINTER_LOC environment variable)`,
    );
  }

  if (AEP_OPENAPI_LINTER_LOC) {
    console.log(`✓ OpenAPI Linter folder found: ${AEP_OPENAPI_LINTER_LOC}`);
    if (fs.existsSync(AEP_OPENAPI_LINTER_LOC)) {
      console.log(`  - Path exists and is accessible`);
    } else {
      console.log(`  - ⚠️  Path does not exist`);
    }
  } else {
    console.log(
      `✗ OpenAPI Linter folder not configured (AEP_OPENAPI_LINTER_LOC environment variable)`,
    );
  }

  if (AEP_COMPONENTS) {
    console.log(`✓ Components folder found: ${AEP_COMPONENTS}`);
    if (fs.existsSync(AEP_COMPONENTS)) {
      console.log(`  - Path exists and is accessible`);
    } else {
      console.log(`  - ⚠️  Path does not exist`);
    }
  } else {
    console.log(
      `✗ Components folder not configured (AEP_COMPONENTS_LOC environment variable)`,
    );
  }

  if (AEP_EDITION_2026) {
    console.log(`✓ AEP Edition 2026 folder found: ${AEP_EDITION_2026}`);
    if (fs.existsSync(AEP_EDITION_2026)) {
      console.log(`  - Path exists and is accessible`);
    } else {
      console.log(`  - ⚠️  Path does not exist`);
    }
  } else {
    console.log(
      `✗ AEP Edition 2026 folder not configured (AEP_EDITION_2026 environment variable)`,
    );
  }

  console.log("");
}

async function getFilePaths(dirPath: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  const files = entries.map((entry) => path.join(dirPath, entry.name));

  return files;
}

async function getFilePathsRecursive(dirPath: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        return getFilePathsRecursive(fullPath);
      }
      return [fullPath];
    }),
  );

  return files.flat();
}

async function writePage(
  dirPath: string,
  filename: string,
  outputPath: string,
  title?: string,
): Promise<string> {
  const filePath = path.join(dirPath, filename);
  logFileRead(filePath, "Page content");
  let contents = new Markdown(fs.readFileSync(filePath, "utf-8"), {});
  const pageTitle = title ?? getTitle(contents.contents);
  contents.frontmatter = {
    title: pageTitle,
  };
  writeFile(outputPath, contents.removeTitle().build());
  return pageTitle;
}

async function writePagesToSiteStructure(
  dirPath: string,
  siteStructure: SiteStructure,
): Promise<SiteStructure> {
  const entries = await fs.promises.readdir(
    path.join(dirPath, "pages/general/"),
    { withFileTypes: true },
  );

  let files = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(".md"),
  );

  for (var file of files) {
    const title = await writePage(
      path.join(dirPath, "pages/general"),
      file.name,
      path.join("src/content/docs", file.name),
    );
    const link = file.name.replace(".md", "");
    addOverviewPage(siteStructure, { label: title, link });
  }
  const contributingTitle = await writePage(
    dirPath,
    "CONTRIBUTING.md",
    path.join("src/content/docs", "contributing.md"),
  );
  addOverviewPage(siteStructure, {
    label: contributingTitle,
    link: "contributing",
  });
  return siteStructure;
}

function readAEP(dirPath: string): string[] {
  const md_path = path.join(dirPath, "aep.md.j2");
  const yaml_path = path.join(dirPath, "aep.yaml");

  logFileRead(md_path, "AEP markdown template");
  const md_contents = fs.readFileSync(md_path, "utf8");

  logFileRead(yaml_path, "AEP metadata");
  const yaml_text = fs.readFileSync(yaml_path, "utf8");

  return [md_contents, yaml_text];
}

function readGroupFile(dirPath: string): GroupFile {
  const group_path = path.join(dirPath, "aep/general/scope.yaml");
  logFileRead(group_path, "AEP group configuration");
  const yaml_contents = fs.readFileSync(group_path, "utf-8");
  return load(yaml_contents) as GroupFile;
}

function buildAEP(files: string[], folder: string): AEP {
  const md_text = files[0];
  const yaml_text = files[1];

  const yaml = load(yaml_text);

  yaml.title = getTitle(md_text).replace("\n", "");
  let slug = yaml.slug;
  delete yaml.slug;

  let contents = buildMarkdown(md_text, folder);

  contents.frontmatter = yaml;
  contents.addComponent({
    names: ["Aside", "Tabs", "TabItem"],
    path: "@astrojs/starlight/components",
  });
  contents.addComponent({
    names: ["Sample"],
    path: "/src/components/Sample.astro",
  });

  contents.frontmatter["prev"] = false;
  contents.frontmatter["next"] = false;

  contents.frontmatter["isAEP"] = true;

  // Write everything to a markdown file.
  return {
    title: yaml.title,
    id: yaml.id,
    slug: slug,
    frontmatter: yaml,
    category: yaml.placement.category,
    order: yaml.placement.order,
    contents: contents,
  };
}

function writeMarkdown(aep: AEP) {
  const filePath = path.join("src/content/docs", `${aep.id}.mdx`);
  writeFile(filePath, aep.contents.build());
}

function writeSidebar(sideBar: any, filePath: string) {
  writeFile(path.join("generated", filePath), JSON.stringify(sideBar));
}

async function assembleAEPs(): Promise<AEP[]> {
  let AEPs = [];
  const aep_folders = await getFolders(path.join(AEP_LOC, "aep/general/"));
  for (var folder of aep_folders) {
    try {
      const files = readAEP(folder);
      AEPs.push(buildAEP(files, folder));
    } catch (e) {
      console.log(`AEP ${folder} failed with error ${e}`);
    }
  }
  return AEPs;
}

function buildRedirects(aeps: AEP[]): object {
  return Object.fromEntries(aeps.map((aep) => [`/${aep.slug}`, `/${aep.id}`]));
}

/**
 * Cleans transformed MDX/JSX content back into plain Markdown
 * suitable for LLM consumption.
 */
export function cleanContentForLLMs(content: string): string {
  let cleaned = content;

  // Remove import statements
  cleaned = cleaned.replace(/import\s+.*from\s+['"].*['"];?\n?/g, "");

  // Replace <b class="...">keyword</b> with **keyword** (restore rule identifiers)
  cleaned = cleaned.replace(/<b class="[^"]*">(.*?)<\/b>/g, "**$1**");

  // Replace <AepLink href="...">text</AepLink> with [text](href)
  cleaned = cleaned.replace(
    /<AepLink href="([^"]*)">(.*?)<\/AepLink>/g,
    "[$2]($1)",
  );
  cleaned = cleaned.replace(/<AepLink>(.*?)<\/AepLink>/g, "$1");

  // Replace <Aside> with markdown callout format
  cleaned = cleaned.replace(
    /<Aside[^>]*title="([^"]*)"[^>]*>\n?([\s\S]*?)\n?<\/Aside>/g,
    (match, title, body) =>
      `**${title}:** ${body
        .split("\n")
        .map((l: string) => l.trim())
        .join("\n")}`,
  );

  // Handle Tabs/TabItem - convert to markdown sections
  cleaned = cleaned.replace(/<Tabs[^>]*>\s*/g, "");
  cleaned = cleaned.replace(/<\/Tabs>\s*/g, "");
  cleaned = cleaned.replace(/<TabItem label="([^"]*)">\s*/g, "#### $1\n");
  cleaned = cleaned.replace(/<\/TabItem>\s*/g, "");

  // Remove <Sample> tags
  cleaned = cleaned.replace(/<Sample[^>]*\/>/g, "");

  // Remove remaining uppercase component tags (JSX)
  cleaned = cleaned.replace(
    /<[A-Z][^>]*\/?>[\s\S]*?<\/[A-Z][^>]*>|<[A-Z][^>]*\/>/gs,
    "",
  );

  // Remove JSX comments
  cleaned = cleaned.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");

  // Unescape comparison operators
  cleaned = cleaned.replace(/\\<=/g, "<=");
  cleaned = cleaned.replace(/\\>=/g, ">=");

  // Clean up excessive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

/**
 * Extracts the first paragraph from cleaned markdown content.
 * Skips headings and blank lines, returns the first block of text.
 */
export function getFirstParagraph(content: string): string {
  const paragraphs = content.split(/\n\n+/);
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("---")) {
      // Collapse to single line for summary use
      return trimmed.replace(/\n/g, " ");
    }
  }
  return "";
}

/**
 * Extracts lines containing should/must/may rule keywords from cleaned content.
 */
export function extractRules(content: string): string[] {
  const rules: string[] = [];
  const lines = content.split("\n");
  const ruleKeywords = /\*\*(must|must not|should|should not|may|may not)\*\*/i;

  for (const line of lines) {
    if (ruleKeywords.test(line)) {
      let trimmed = line.trim();
      if (trimmed) {
        // Normalize bullet points
        if (!trimmed.startsWith("-")) {
          trimmed = `- ${trimmed}`;
        }
        rules.push(trimmed);
      }
    }
  }

  // Deduplicate
  return [...new Set(rules)];
}

/**
 * Builds a per-AEP llms.txt file with the full cleaned markdown content.
 */
export function buildPerAEPLLMsTxt(aep: AEP): string {
  const cleaned = cleanContentForLLMs(aep.contents.contents);
  return `# AEP-${aep.id}: ${aep.title}\n\n${cleaned}`;
}

/**
 * Builds the site-wide llms.txt with a short description of each AEP
 * and all should/must/may rules.
 */
export function buildLLMsTxt(aeps: AEP[]): string {
  // Sort AEPs by ID for consistent ordering
  const sortedAEPs = aeps.sort((a, b) => parseInt(a.id) - parseInt(b.id));

  const lines: string[] = [];
  lines.push("# AEP - API Enhancement Proposals");
  lines.push("");
  lines.push(
    "> API Enhancement Proposals (AEPs) are design documents that provide high-quality, consistent guidance for API development.",
  );
  lines.push("");
  lines.push("## AEPs");
  lines.push("");

  for (const aep of sortedAEPs) {
    const cleaned = cleanContentForLLMs(aep.contents.contents);
    const description = getFirstParagraph(cleaned);
    lines.push(
      `- [AEP-${aep.id}: ${aep.title}](/${aep.id}/llms.txt): ${description}`,
    );
  }

  lines.push("");
  lines.push("## Rules");

  for (const aep of sortedAEPs) {
    const cleaned = cleanContentForLLMs(aep.contents.contents);
    const rules = extractRules(cleaned);
    if (rules.length > 0) {
      lines.push("");
      lines.push(`### AEP-${aep.id}: ${aep.title}`);
      lines.push("");
      for (const rule of rules) {
        lines.push(rule);
      }
    }
  }

  return lines.join("\n");
}

// Log folder detection status
logFolderDetection();

// Create site structure
let siteStructure = createEmptySiteStructure();

if (AEP_LOC != "") {
  console.log("=== Processing AEP Repository ===");
  // Build config.
  let config = loadConfigFiles("hero.yaml", "urls.yaml", "site.yaml");
  writeSidebar(config, "config.json");

  // Write assorted pages.
  siteStructure = await writePagesToSiteStructure(AEP_LOC, siteStructure);

  // Build out AEPs.
  let aeps = await assembleAEPs();

  // Add AEPs to site structure
  const groups = readGroupFile(AEP_LOC);
  addAEPEdition(siteStructure, "general", aeps, groups, ".");

  // Write AEPs to files (only categorized ones to match sidebar).
  const validCategories = new Set(groups.categories.map((c) => c.code));
  const categorizedAEPs = aeps.filter((aep) =>
    validCategories.has(aep.category),
  );
  for (var aep of categorizedAEPs) {
    writeMarkdown(aep);
  }

  writeSidebar(buildRedirects(categorizedAEPs), "redirects.json");

  // Generate per-AEP llms.txt files
  for (const aep of categorizedAEPs) {
    const perAEPContent = buildPerAEPLLMsTxt(aep);
    writeFile(path.join("public", aep.id, "llms.txt"), perAEPContent);
  }

  // Generate site-wide llms.txt with summaries and rules
  const llmsTxtContent = buildLLMsTxt(categorizedAEPs);
  writeFile("public/llms.txt", llmsTxtContent);

  // Write blog
  const entries = await fs.promises.readdir(path.join(AEP_LOC, "blog/"), {
    withFileTypes: true,
  });

  let files = entries.filter((entry) => entry.isFile());

  for (var file of files) {
    const blogFilePath = path.join(AEP_LOC, "blog", file.name);
    logFileRead(blogFilePath, "Blog post");
    copyFile(blogFilePath, path.join("src/content/docs/blog", file.name));
  }
} else {
  console.warn("AEP repo is not found.");
}

if (AEP_LINTER_LOC != "") {
  console.log("=== Processing Linter Repository ===");
  // Write linter pages.
  await writePage(
    AEP_LINTER_LOC,
    "README.md",
    "src/content/docs/tooling/linter/index.md",
    "Protobuf Linter",
  );

  // Write site generator.
  await writePage(
    ".",
    "README.md",
    "src/content/docs/tooling/website/index.md",
    "",
  );

  // Write out linter rules.
  let linter_rules = await assembleLinterRules(AEP_LINTER_LOC);
  let consolidated_rules = consolidateLinterRule({ linterRules: linter_rules });
  for (var rule of consolidated_rules) {
    writeRule(rule);
  }

  // Add to site structure
  addLinterRules(
    siteStructure,
    consolidated_rules.map((r) => r.aep),
  );
  addToolingPage(siteStructure, { label: "Website", link: "tooling/website" });
} else {
  console.warn("Proto linter repo is not found.");
}

if (AEP_OPENAPI_LINTER_LOC != "") {
  console.log("=== Processing OpenAPI Linter Repository ===");

  // Process OpenAPI linter rules
  const openapiLinterRules = await assembleOpenAPILinterRules(
    AEP_OPENAPI_LINTER_LOC,
  );

  if (openapiLinterRules.length > 0) {
    // Write OpenAPI linter overview page
    await writePage(
      AEP_OPENAPI_LINTER_LOC,
      "README.md",
      "src/content/docs/tooling/openapi-linter/index.md",
      "OpenAPI Linter",
    );

    // Consolidate rules (groups by AEP number)
    const consolidatedOpenAPIRules = consolidateLinterRule({
      linterRules: openapiLinterRules,
    });

    // Write rule markdown files
    for (const rule of consolidatedOpenAPIRules) {
      const outputPath = path.join(
        "src/content/docs/tooling/openapi-linter/rules",
        `${rule.aep}.md`,
      );
      writeRule(rule, outputPath);
    }

    // Add to site structure
    addOpenAPILinterRules(
      siteStructure,
      consolidatedOpenAPIRules.map((r) => r.aep),
    );

    console.log("✅ OpenAPI linter integration complete\n");
  } else {
    console.log("ℹ️  No OpenAPI linter rules found, skipping integration\n");
  }
} else {
  console.log("ℹ️  OpenAPI linter repo not configured, skipping...\n");
}

if (AEP_COMPONENTS != "") {
  console.log("=== Processing Components Repository ===");
  // Read all YAML component files.
  const filePaths = await getFilePathsRecursive(
    path.join(AEP_COMPONENTS, "json_schema"),
  );
  for (const filePath of filePaths) {
    logFileRead(filePath, "Component schema");
    const fileContents = fs.readFileSync(filePath, "utf-8");
    try {
      const contentObject = load(fileContents);
      const id = contentObject.$id;
      const componentPath = id.replace("https://aep.dev/", "");
      // Write JSON schema files to public directory
      const jsonContents = JSON.stringify(contentObject, null, 2);
      writeFile(path.join("public", componentPath), jsonContents);
    } catch (e) {
      console.error(`Error converting ${filePath} to YAML: ${e}`);
    }
  }
}

if (AEP_EDITION_2026 != "") {
  console.log("=== Processing AEP Edition 2026 ===");
  // Build out AEPs from the 2026 edition
  let aeps2026 = [];
  const aep_folders_2026 = await getFolders(
    path.join(AEP_EDITION_2026, "aep/general/"),
  );
  for (var folder of aep_folders_2026) {
    try {
      const files = readAEP(folder);
      const aep = buildAEP(files, folder);
      aeps2026.push(aep);

      // Write to aep-2026 directory instead of root
      aep.contents.frontmatter.slug = `aep-2026/${aep.id.toString()}`;
      const filePath = path.join("src/content/docs/aep-2026", `${aep.id}.mdx`);
      writeFile(filePath, aep.contents.build());

      console.log(`✓ Processed AEP-${aep.id} for 2026 edition`);
    } catch (e) {
      console.log(`AEP ${folder} failed with error ${e}`);
    }
  }

  // Add 2026 edition to site structure
  const groups2026 = readGroupFile(AEP_EDITION_2026);
  addAEPEdition(siteStructure, "aep-2026", aeps2026, groups2026, "aep-2026");

  console.log("✅ AEP Edition 2026 processing complete\n");
} else {
  console.log("ℹ️  AEP Edition 2026 repo not configured, skipping...\n");
}

// Write site structure to JSON
writeSiteStructure(siteStructure, "generated/site-structure.json");
