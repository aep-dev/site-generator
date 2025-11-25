import * as fs from "fs";
import * as path from "path";

import loadConfigFiles from "./src/config";
import { type AEP, type GroupFile, type LinterRule } from "./src/types";
import { buildMarkdown, Markdown } from "./src/markdown";
import { load, dump } from "js-yaml";
import {
  assembleLinterRules,
  assembleOpenAPILinterRules,
  writeLinterRulesJSON,
  getUniqueAeps,
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

export function buildLLMsTxt(aeps: AEP[]): string {
  // Sort AEPs by ID for consistent ordering
  const sortedAEPs = aeps.sort((a, b) => parseInt(a.id) - parseInt(b.id));

  const sections = sortedAEPs.map((aep) => {
    // Get the raw markdown content without frontmatter and components
    let content = aep.contents.contents;

    // Remove any remaining component imports or JSX-style tags
    content = content.replace(/import\s+.*from\s+['"].*['"];?\n?/g, "");
    content = content.replace(
      /<[A-Z][^>]*\/?>.*?<\/[A-Z][^>]*>|<[A-Z][^>]*\/>/gs,
      "",
    );

    // Clean up any remaining MDX artifacts
    content = content.replace(/\{\/\*[\s\S]*?\*\/\}/g, ""); // Remove JSX comments
    content = content.replace(/<!--[\s\S]*?-->/g, ""); // Remove HTML comments
    content = content.trim();

    return `# AEP-${aep.id} ${aep.title}\n\n${content}`;
  });

  return sections.join("\n\n---\n\n");
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

  // Generate llms.txt file with all AEP contents
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

  // Write out linter rules as JSON for Astro to consume
  // The rules are now rendered by Astro components instead of being pre-consolidated
  // See: src/pages/tooling/linter/rules/[aep].astro and src/components/LinterRules.astro
  let linter_rules = await assembleLinterRules(AEP_LINTER_LOC);
  writeLinterRulesJSON(linter_rules, "generated/linter-rules/protobuf.json");

  // Add to site structure
  addLinterRules(siteStructure, getUniqueAeps(linter_rules));
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

    // Write OpenAPI linter rules as JSON for Astro to consume
    // The rules are now rendered by Astro components instead of being pre-consolidated
    // See: src/pages/tooling/openapi-linter/rules/[aep].astro and src/components/LinterRules.astro
    writeLinterRulesJSON(
      openapiLinterRules,
      "generated/linter-rules/openapi.json",
    );

    // Add to site structure
    addOpenAPILinterRules(siteStructure, getUniqueAeps(openapiLinterRules));

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
