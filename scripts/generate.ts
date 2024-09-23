import * as fs from 'fs';
import * as path from 'path';

import loadConfigFiles from './src/config';
import { buildSidebar, buildLinterSidebar, addToSidebar } from './src/sidebar';
import { type AEP, type ConsolidatedLinterRule, type GroupFile, type LinterRule, type Sidebar } from './src/types';
import { buildMarkdown, Markdown } from './src/markdown';
import { load, dump } from "js-yaml";

const AEP_LOC = process.env.AEP_LOCATION!;
const AEP_LINTER_LOC = process.env.AEP_LINTER_LOC!;

async function getFolders(dirPath: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  const folders = entries
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(dirPath, entry.name));

  return folders;
}

async function getLinterRules(dirPath: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  const folders = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.md') && !entry.name.endsWith('index.md'))
    .map(entry => path.join(dirPath, entry.name));

  return folders;
}

async function writePage(dirPath: string, filename: string, outputPath: string, title: string) {
  let contents = new Markdown(fs.readFileSync(path.join(dirPath, filename), 'utf-8'), {});
  contents.frontmatter = {
    'title': title ?? getTitle(contents.contents)
  }
  fs.writeFileSync(outputPath, contents.removeTitle().build(), { flag: 'w' });
}

async function writePages(dirPath: string, sidebar: Sidebar): Promise<Sidebar> {
  const entries = await fs.promises.readdir(path.join(dirPath, "pages/general/"), { withFileTypes: true });

  let files = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))

  for (var file of files) {
    writePage(path.join(dirPath, "pages/general"), file.name, path.join("src/content/docs", file.name));
    addToSidebar(sidebar, "Overview", [file.name.replace('.md', '')])
  }
  writePage(dirPath, "CONTRIBUTING.md", path.join("src/content/docs", "contributing.md"));
  addToSidebar(sidebar, "Overview", ["contributing"]);
  return sidebar;
}

function readAEP(dirPath: string): string[] {
  const md_path = path.join(dirPath, "aep.md.j2");
  const yaml_path = path.join(dirPath, "aep.yaml");

  const md_contents = fs.readFileSync(md_path, 'utf8');
  const yaml_text = fs.readFileSync(yaml_path, 'utf8');

  return [md_contents, yaml_text];
}

function readGroupFile(dirPath: string): GroupFile {
  const group_path = path.join(dirPath, "aep/general/scope.yaml")
  const yaml_contents = fs.readFileSync(group_path, "utf-8");
  return load(yaml_contents) as GroupFile;
}

function getTitle(contents: string): string {
  var title_regex = /# (.*)\n/
  const matches = contents.match(title_regex);
  return matches[1]!.replaceAll(':', '-').replaceAll('`', '')
}

function buildAEP(files: string[], folder: string): AEP {
  const md_text = files[0];
  const yaml_text = files[1];

  const yaml = load(yaml_text);

  yaml.title = getTitle(md_text).replace('\n', '');

  let contents = buildMarkdown(md_text, folder);

  contents.frontmatter = yaml;
  contents.addComponent({'names': ['Aside', 'Tabs', 'TabItem'], 'path': '@astrojs/starlight/components'})
  contents.addComponent({'names': ['Sample'], 'path': '../../components/Sample.astro'})

  // Write everything to a markdown file.
  return {
    title: yaml.title,
    id: yaml.id,
    frontmatter: yaml,
    category: yaml.placement.category,
    order: yaml.placement.order,
    slug: yaml.slug,
    contents: contents,
  }
}

function writeMarkdown(aep: AEP) {
  aep.contents.frontmatter.slug = aep.id.toString();

  const filePath = path.join("src/content/docs", `${aep.id}.mdx`)
  fs.writeFileSync(filePath, aep.contents.build(), { flag: "w" });

  aep.contents.frontmatter.slug = aep.slug;

  const slugPath = path.join("src/content/docs", `${aep.slug}.mdx`)
  fs.writeFileSync(slugPath, aep.contents.build(), { flag: "w" });
}

function writeSidebar(sideBar: any, filePath: string) {
  fs.writeFileSync(path.join("generated", filePath), JSON.stringify(sideBar), { flag: "w" });
}

async function assembleAEPs(): Promise<AEP[]> {
  let AEPs = [];
  const aep_folders = await getFolders(path.join(AEP_LOC, "aep/general/"));
  for (var folder of aep_folders) {
    try {
      const files = readAEP(folder);
      AEPs.push(buildAEP(files, folder));
    }
    catch (e) {
      console.log(`AEP ${folder} failed with error ${e}`)
    }
  }
  return AEPs;
}

async function assembleLinterRules(): Promise<LinterRule[]> {
  let linterRules = [];
  const linter_rule_folders = await getFolders(path.join(AEP_LINTER_LOC, "docs/rules/"));
  for (var folder of linter_rule_folders) {
    try {
      const linter_files = await getLinterRules(folder);
      for (var linter_file of linter_files) {
        linterRules.push(buildLinterRule(linter_file, folder.split('/')[folder.split('/').length - 1]));
      }
    }
    catch (e) {
      console.log(`Linter Rule ${folder} failed with error ${e}`)
    }
  }
  return linterRules;
}

function buildLinterRule(rulePath: string, aep: string): LinterRule {
  let contents = fs.readFileSync(rulePath, 'utf-8');
  let title = getTitle(contents);

  contents = contents.replace('---', `---\ntitle: ${title}`)

  let filename = rulePath.split('/')[rulePath.split('/').length - 1];

  return {
    'title': title,
    'aep': aep,
    'contents': contents,
    'filename': filename,
    'slug': filename.split('.')[0]
  }
}

function consolidateLinterRule(linterRules: LinterRule[]): ConsolidatedLinterRule[] {
  let rules = {}
  for(var rule of linterRules) {
    if(rule.aep in rules) {
      rules[rule.aep].push(rule)
    } else {
      rules[rule.aep] = [rule];
    }
  }

  let consolidated_rules = [];
  for(var key in rules) {
    let rules_contents = rules[key].map((aep) => `<details>
<summary>${aep.title}</summary>
${aep.contents.replace(/---[\s\S]*?---/m, '')}
</details>
`
)
let contents = `---
title: AEP-${rules[key][0].aep} Linter Rules
---
${rules_contents.join('\n')}
`
consolidated_rules.push({'contents': contents, 'aep': rules[key][0].aep})
  }
  return consolidated_rules;
}

function writeRule(rule: ConsolidatedLinterRule) {
  const filePath = path.join(`src/content/docs/tooling/linter/rules/`, `${rule.aep}.md`)
  fs.writeFileSync(filePath, rule.contents, { flag: "w" });
}

function buildFullAEPList(aeps: AEP[]) {
  let response = [];
  let groups = readGroupFile(AEP_LOC);

  for (var group of groups.categories) {
    response.push({
      'label': group.title,
      'items': aeps.filter((aep) => aep.category == group.code).sort((a1, a2) => a1.order > a2.order ? 1 : -1).map((aep) => {
        return {
          'title': aep.title,
          'id': aep.id,
          'slug': aep.slug,
          'status': aep.frontmatter.state,
        };
      }),
    })
  }
  return response;
}

function buildIndexPage(aeps: AEP[]) {
  var sections = [];
  let groups = readGroupFile(AEP_LOC);
  for(var group of groups.categories) {
    sections.push(`# ${group.title}`)
    sections.push(`<AepList label="${group.title}" />`)
  }

  var contents = `---
title: AEPs
tableOfContents:
    minHeadingLevel: 1
---
import AepList from "../../components/AepList.astro";

${sections.join("\n")}
`
  fs.writeFileSync(`src/content/docs/general.mdx`, contents);
}

function buildRedirects(aeps: AEP[]): object {
  return {};
}

// Build config.
let config = loadConfigFiles("hero.yaml", "urls.yaml", "site.yaml");
writeSidebar(config, "config.json");

// Build out AEPs.
let aeps = await assembleAEPs();

// Build sidebar.
let sidebar = buildSidebar(aeps, readGroupFile(AEP_LOC));

let full_aeps = buildFullAEPList(aeps);
writeSidebar(full_aeps, "full_aeps.json");


// Write AEPs to files.
for (var aep of aeps) {
  writeMarkdown(aep);
}

// Write assorted pages.
sidebar = await writePages(AEP_LOC, sidebar);

// Write linter pages.
await writePage(AEP_LINTER_LOC, "README.md", "src/content/docs/tooling/linter/index.md", "Protobuf Linter")

writeSidebar(sidebar, "sidebar.json");

// Write out linter rules.
let linter_rules = await assembleLinterRules();
let consolidated_rules = consolidateLinterRule(linter_rules);
for (var rule of consolidated_rules) {
  writeRule(rule);
}

var linter_sidebar = buildLinterSidebar(consolidated_rules);
writeSidebar(linter_sidebar, "linter_sidebar.json");

buildIndexPage(aeps);
writeSidebar(buildRedirects(aeps), "redirects.json");