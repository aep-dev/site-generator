import * as fs from 'fs';
import * as path from 'path';
import { load, dump } from "js-yaml";

interface AEP {
  title: string;
  id: string;
  frontmatter: object;
  contents: string;
  category: string;
  order: number;
  slug: string;
}

interface Contents {
  contents: string;
  components: string[];
}

interface GroupFile {
  categories: Group[]
}

interface Group {
  code: string;
  title: string;
}


const AEP_LOC = process.env.AEP_LOCATION!;

const callouts = ['Important', 'Note', 'TL;DR', 'Warning', 'Summary'];

async function getFolders(dirPath: string): Promise<string[]> {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  
    const folders = entries
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(dirPath, entry.name));
  
    return folders;
}

async function writePages(dirPath: string) {
    const entries = await fs.promises.readdir(path.join(dirPath, "pages/general/"), { withFileTypes: true });
  
    let files = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))

    for(var file of files) {
      let contents = fs.readFileSync(path.join(dirPath, "pages/general/", file.name))
      fs.writeFileSync(path.join("src/content/docs", file.name), contents, {flag: 'w'});
    }
}

function readAEP(dirPath: string): string[] {
    const md_path = path.join(dirPath, "aep.md.j2");
    const yaml_path = path.join(dirPath, "aep.yaml");

    const md_contents = fs.readFileSync(md_path,'utf8');
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

function buildMarkdown(contents: string, folder: string): Contents {
  let result = {
    'contents': contents,
    'components': []
  }
  substituteSamples(result, folder);
  substituteTabs(result);
  substituteHTMLComments(result);
  substituteEscapeCharacters(result);

  return result;
}

function substituteEscapeCharacters(contents: Contents) {
  contents.contents = contents.contents.replaceAll('<=', '\\<=')
                                       .replaceAll('>=', '\\>=');
}

function createAEP(files: string[], folder: string): AEP {
  const md_text = files[0];
  const yaml_text = files[1];

  const yaml = load(yaml_text);

  // Add title to yaml
  var title_regex = /^# (.*)\n/
  const matches = md_text.match(title_regex);
  const title = matches[1]!;

  yaml.title = title;

  let contents = buildMarkdown(md_text, folder);

  // Write everything to a markdown file.
  return {
    title: title,
    id: yaml.id,
    frontmatter: yaml,
    category: yaml.placement.category,
    order: yaml.placement.order,
    slug: yaml.slug,
    contents: `---
${dump(yaml)}
--- 
import { Tabs, TabItem } from '@astrojs/starlight/components';

${contents.contents}`
  }
}

function substituteHTMLComments(contents: Contents) {
  contents.contents = contents.contents.replaceAll("<!-- ", "{/* ")
                                       .replaceAll("-->", " */}")
}

function substituteTabs(contents: Contents) {
  var tab_regex = /\{% tab proto -?%\}([\s\S]*?)\{% tab oas -?%\}([\s\S]*?)\{% endtabs -?%\}/g
  let tabs = []
  
  let matches = contents.contents.matchAll(tab_regex);
  for(var match of matches) {
    tabs.push({'match': match[0],
       'proto': match[1].split('\n').map((x) => '  ' + x).join('\n'),
        'oas': match[2].split('\n').map((x) => '  ' + x).join('\n')});
  }
  for(var tab of tabs) {
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

function substituteSamples(contents: Contents, folder: string) {
  var sample_regex = /\{% sample '(.*)', '(.*)', '(.*)' %}/g
  var sample2_regex = /\{% sample '(.*)', '(.*)' %}/g

  
  let samples = []
  // TODO: Do actual sample parsing.
  const matches = contents.contents.matchAll(sample_regex);
  for(var match of matches) {
    if(match[1].endsWith('proto') || match[1].endsWith('yaml')) {
      samples.push({'match': match[0], 'filename': match[1]})
    }
  }

  const matches2 = contents.contents.matchAll(sample2_regex);
  for(var match of matches2) {
    if(match[1].endsWith('proto') || match[1].endsWith('yaml')) {
      samples.push({'match': match[0], 'filename': match[1]})
    }
  }

  for(var sample of samples) {
    const sample_contents = readSample(folder, sample.filename)
    let type = sample.filename.endsWith('proto') ? 'protobuf' : 'yml';
    let formatted_sample = `
      \`\`\`${type}
      ${sample_contents}
      \`\`\`
    `
    contents.contents = contents.contents.replace(sample.match, formatted_sample)
  }
}

function writeMarkdown(aep: AEP) {
  const filePath = path.join("src/content/docs", `${aep.id}.mdx`)
  fs.writeFileSync(filePath, aep.contents, {flag: "w"});
}

function writeSidebar(sideBar: object[]) {
  const filePath = "sidebar.json";
  fs.writeFileSync(filePath, JSON.stringify(sideBar), {flag: "w"});
}

async function assembleAEPs(): Promise<AEP[]> {
  let AEPs = [];
  const aep_folders = await getFolders(path.join(AEP_LOC, "aep/general/"));
  for(var folder of aep_folders) {
    try {
      const files = readAEP(folder);
      AEPs.push(createAEP(files, folder));
    }
    catch(e) {
      console.log(`AEP ${folder} failed with error ${e}`)
    }
  }
  return AEPs;
}

function buildSidebar(aeps: AEP[]): object[] {
  let response = [];
  let groups = readGroupFile(AEP_LOC);

  for(var group of groups.categories) {
    response.push({
      'label': group.title,
      'items': aeps.filter((aep) => aep.category == group.code).sort((a1, a2) => a1.order > a2.order ? 1 : -1).map((aep) => aep.slug)
    })
  }
  return response;
}

// Build out AEPs.
let aeps = await assembleAEPs();

// Build sidebar.
let sidebar = buildSidebar(aeps);
writeSidebar(sidebar);


// Write AEPs to files.
for(var aep of aeps) {
  writeMarkdown(aep);
}

writePages(AEP_LOC);
