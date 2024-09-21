import * as fs from 'fs';
import * as path from 'path';
import { load, dump } from "js-yaml";

import loadConfigFiles from './src/config';

interface AEP {
  title: string;
  id: string;
  frontmatter: object;
  contents: string;
  category: string;
  order: number;
  slug: string;
}

interface LinterRule {
  title: string;
  aep: string;
  contents: string;
  filename: string;
  slug: string;
}

interface ConsolidatedLinterRule {
  aep: string;
  contents: string;
}

interface Markdown {
  contents: string;
  components: Set<string>;
}

interface GroupFile {
  categories: Group[]
}

interface Group {
  code: string;
  title: string;
}


const AEP_LOC = process.env.AEP_LOCATION!;
const AEP_LINTER_LOC = process.env.AEP_LINTER_LOC!;

const ASIDES = {
  'Important': { 'title': 'Important', 'type': 'caution' },
  'Note': { 'title': 'Note', 'type': 'note' },
  'TL;DR': { 'title:': 'TL;DR', 'type': 'tip' },
  'Warning': { 'title': 'Warning', 'type': 'danger' },
  'Summary': { 'type': 'tip', 'title': 'Summary' }
};

const RULE_COLORS = {
  'may': 'font-extrabold text-green-700',
  'may not': 'font-extrabold text-green-700',
  'should': 'font-extrabold	text-yellow-700',
  'should not': 'font-extrabold	text-yellow-700',
  'must': 'font-extrabold	text-red-700',
  'must not': 'font-extrabold	text-red-700'
}

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

async function writePage(dirPath: string, filename: string) {
  let contents = fs.readFileSync(path.join(dirPath, filename), 'utf-8')
  let frontmatter = {
    'title': getTitle(contents.toString())
  }
  let final = `---
${dump(frontmatter)}
---
${contents}`
  fs.writeFileSync(path.join("src/content/docs", filename), final, { flag: 'w' });
}

async function writePages(dirPath: string) {
  const entries = await fs.promises.readdir(path.join(dirPath, "pages/general/"), { withFileTypes: true });

  let files = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))

  for (var file of files) {
    writePage(path.join(dirPath, "pages/general"), file.name);
  }
  writePage(dirPath, "CONTRIBUTING.md");
}

function readAEP(dirPath: string): string[] {
  const md_path = path.join(dirPath, "aep.md.j2");
  const yaml_path = path.join(dirPath, "aep.yaml");

  const md_contents = fs.readFileSync(md_path, 'utf8');
  const yaml_text = fs.readFileSync(yaml_path, 'utf8');

  return [md_contents, yaml_text];
}

function readSample(dirPath: string, sample: string) {
  const sample_path = path.join(dirPath, sample);
  return fs.readFileSync(sample_path, "utf-8");
}

function readGroupFile(dirPath: string): GroupFile {
  const group_path = path.join(dirPath, "aep/general/scope.yaml")
  const yaml_contents = fs.readFileSync(group_path, "utf-8");
  return load(yaml_contents) as GroupFile;
}

function buildMarkdown(contents: string, folder: string): Markdown {
  let result = {
    'contents': contents,
    'components': new Set<string>()
  }
  substituteSamples(result, folder);
  substituteTabs(result);
  substituteHTMLComments(result);
  substituteEscapeCharacters(result);
  substituteCallouts(result);
  substituteRuleIdentifiers(result);
  removeTitle(result);
  substituteLinks(result);
  return result;
}

function substituteLinks(contents: Markdown) {
  // Old site-generator expressed relative links as '[link]: ./0123'.
  // These should be expressed as '[link]: /123'

  contents.contents = contents.contents.replaceAll(']: ./', ']: /')
  contents.contents = contents.contents.replaceAll(']: /0', ']: /')
}

function removeTitle(contents: Markdown) {
  // Title should be removed because Starlight will add it for us.
  contents.contents = contents.contents.replace(/# (.*)\n/, '');
}

function substituteRuleIdentifiers(contents: Markdown) {
  var rule_regex = /\*\*(should(?: not)?|may(?: not)?|must(?: not)?)\*\*/g
  var matches = contents.contents.matchAll(rule_regex);
  for(var match of matches) {
    var color = RULE_COLORS[match[1]];
    contents.contents = contents.contents.replace(match[0], `<b class="${color}">${match[1]}</b>`);
  }
}

function substituteCallouts(contents: Markdown) {
  var paragraph_regex =  /(^|\n)\*\*(Note|Warning|Important|Summary|TL;DR):\*\*([\s\S]+?)(?=\n{2,}|$)/g;
  var matches = contents.contents.matchAll(paragraph_regex);
  for (var match of matches) {
    const aside_info = ASIDES[match[2]];
    const formatted_results = `
<Aside type="${aside_info.type}" title="${aside_info.title}">
${tabContents(match[3].trimStart())}
</Aside>`
    contents.contents = contents.contents.replace(match[0], formatted_results);
    contents.components.add('Aside');
  }
}

function substituteEscapeCharacters(contents: Markdown) {
  contents.contents = contents.contents.replaceAll('<=', '\\<=')
    .replaceAll('>=', '\\>=');
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

  yaml.title = getTitle(md_text);

  let contents = buildMarkdown(md_text, folder);

  // Write everything to a markdown file.
  return {
    title: yaml.title,
    id: yaml.id,
    frontmatter: yaml,
    category: yaml.placement.category,
    order: yaml.placement.order,
    slug: yaml.slug,
    contents: `---
${dump(yaml)}
--- 
import { Aside, Tabs, TabItem } from '@astrojs/starlight/components';
import Sample from '../../components/Sample.astro';

${contents.contents}`
  }
}

function substituteHTMLComments(contents: Markdown) {
  contents.contents = contents.contents.replaceAll("<!-- ", "{/* ")
    .replaceAll("-->", " */}")
}

function tabContents(contents: string): string {
  return contents.split('\n').map((x) => '  ' + x).join('\n');
}

function substituteTabs(contents: Markdown) {
  var tab_regex = /\{% tab proto -?%\}([\s\S]*?)\{% tab oas -?%\}([\s\S]*?)\{% endtabs -?%\}/g
  let tabs = []

  let matches = contents.contents.matchAll(tab_regex);
  for (var match of matches) {
    tabs.push({
      'match': match[0],
      'proto': tabContents(match[1]),
      'oas': tabContents(match[2]),
    });
  }
  for (var tab of tabs) {
    var new_tab = `
<Tabs>
  <TabItem label="Protocol Buffers">
${tab['proto']}
  </TabItem>
  <TabItem label="OpenAPI 3.0">
${tab['oas']}
  </TabItem>
</Tabs>
    `
    contents.contents = contents.contents.replace(tab.match, new_tab);
  }
}

function substituteSamples(contents: Markdown, folder: string) {
  var sample_regex = /\{% sample '(.*)', '(.*)', '(.*)' %}/g
  var sample2_regex = /\{% sample '(.*)', '(.*)' %}/g


  let samples = []
  // TODO: Do actual sample parsing.
  const matches = contents.contents.matchAll(sample_regex);
  for (var match of matches) {
    if (match[1].endsWith('proto') || match[1].endsWith('yaml')) {
      samples.push({ 'match': match[0], 'filename': match[1], 'token1': match[2], 'token2': match[3] })
    }
  }

  const matches2 = contents.contents.matchAll(sample2_regex);
  for (var match of matches2) {
    if (match[1].endsWith('proto') || match[1].endsWith('yaml')) {
      samples.push({ 'match': match[0], 'filename': match[1], 'token1': match[2], 'token2': '' })
    }
  }

  for (var sample of samples) {
    let type = sample.filename.endsWith('proto') ? 'protobuf' : 'yml';
    let formatted_sample = `<Sample path="${path.join(folder, sample.filename)}" type="${type}" token1="${sample.token1}" token2="${sample.token2}" />`
    contents.contents = contents.contents.replace(sample.match, formatted_sample);
  }
}

function writeMarkdown(aep: AEP) {
  const filePath = path.join("src/content/docs", `${aep.id}.mdx`)
  fs.writeFileSync(filePath, aep.contents, { flag: "w" });
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

function buildSidebar(aeps: AEP[]): object[] {
  let response = [];
  let groups = readGroupFile(AEP_LOC);

  for (var group of groups.categories) {
    response.push({
      'label': group.title,
      'items': aeps.filter((aep) => aep.category == group.code).sort((a1, a2) => a1.order > a2.order ? 1 : -1).map((aep) => aep.slug)
    })
  }
  return response;
}

function buildLinterSidebar(rules: ConsolidatedLinterRule[]): object[] {
  return [
    {
      'label': 'Tooling',
      'items': [
        {
          'label': 'Linter',
          'items': [
            'tooling/linter',
            {
              'label': 'Rules',
              'items': rules.map((x) => `tooling/linter/rules/${x.aep}`),
            }
          ]
        }
      ]
    }
  ];
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
  return Object.fromEntries(aeps.map((aep) => [`/${aep.id}`, `/${aep.slug}`]));
}

// Build config.
let config = loadConfigFiles("hero.yaml", "urls.yaml", "site.yaml");
writeSidebar(config, "config.json");

// Build out AEPs.
let aeps = await assembleAEPs();

// Build sidebar.
let sidebar = buildSidebar(aeps);
writeSidebar(sidebar, "sidebar.json");

let full_aeps = buildFullAEPList(aeps);
writeSidebar(full_aeps, "full_aeps.json");


// Write AEPs to files.
for (var aep of aeps) {
  writeMarkdown(aep);
}

// Write assorted pages.
writePages(AEP_LOC);

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