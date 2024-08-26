import * as fs from 'fs';
import * as path from 'path';
import { load, dump } from "js-yaml";

import * as nunjucks from 'nunjucks';

interface AEP {
  title: string;
  id: string;

  contents: string;
}



const AEP_LOC = process.env.AEP_LOCATION!;

async function getFolders(dirPath: string): Promise<string[]> {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  
    const folders = entries
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(dirPath, entry.name));
  
    return folders;
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

function createMarkdown(files: string[], folder: string): AEP {
  const md_text = files[0];
  const yaml_text = files[1];

  const yaml = load(yaml_text);

  // Add title to yaml
  var title_regex = /^# (.*)\n/
  const matches = md_text.match(title_regex);
  const title = matches[1]!;

  yaml.title = title;

  const md_text_with_samples = substituteSamples(md_text, folder);
  const md_text_with_tabs_and_samples = substituteTabs(md_text_with_samples);

  const md_text_with_prettier_subs = substituteHTMLComments(md_text_with_tabs_and_samples);


  // Write everything to a markdown file.
  return {
    title: title,
    id: yaml.id,
    contents: `---
${dump(yaml)}
--- 
import { Tabs, TabItem } from '@astrojs/starlight/components';

${md_text_with_prettier_subs}`
  }
}

function substituteHTMLComments(contents: string) {
  return contents.replaceAll("<!-- ", "{/* ")
                 .replaceAll("-->", " */}")
}

function substituteTabs(contents: string) {
  var tab_regex = /\{% tab proto -?%\}([\s\S]*?)\{% tab oas -?%\}([\s\S]*?)\{% endtabs -?%\}/g
  let tabs = []
  
  let matches = contents.matchAll(tab_regex);
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
    contents = contents.replace(tab.match, new_tab);
  }
  return contents;
}

function substituteSamples(contents: string, folder: string) {
  var sample_regex = /\{% sample '(.*)', '(.*)', '(.*)' %}/g
  var sample2_regex = /\{% sample '(.*)', '(.*)' %}/g

  
  let samples = []
  // TODO: Do actual sample parsing.
  const matches = contents.matchAll(sample_regex);
  for(var match of matches) {
    if(match[1].endsWith('proto') || match[1].endsWith('yaml')) {
      samples.push({'match': match[0], 'filename': match[1]})
    }
  }

  const matches2 = contents.matchAll(sample2_regex);
  for(var match of matches2) {
    if(match[1].endsWith('proto') || match[1].endsWith('yaml')) {
      samples.push({'match': match[0], 'filename': match[1]})
    }
  }

  for(var sample of samples) {
    const sample_contents = readSample(folder, sample.filename)
    let formatted_sample = `
      \`\`\`proto
      ${sample_contents}
      \`\`\`
    `
    contents = contents.replace(sample.match, formatted_sample)
  }

  return contents
}

function writeMarkdown(aep: AEP) {
  const filePath = path.join("src/content/docs", `${aep.id}.mdx`)
  fs.writeFileSync(filePath, aep.contents, {flag: "w"});
}

var env = new nunjucks.Environment();

const aep_folders = await getFolders(path.join(AEP_LOC, "aep/general/"));
for(var folder of aep_folders) {
  try {
    const files = readAEP(folder);
    const new_file = createMarkdown(files, folder);
    writeMarkdown(new_file);
  }
  catch(e) {
    console.log(`AEP ${folder} failed with error ${e}`)
  }
}


