import * as fs from 'fs';
import * as path from 'path';
import { load, dump } from "js-yaml";

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

  const md_text_with_tabs = substituteTabs(md_text);

  const md_text_with_tabs_and_samples = substituteSamples(md_text_with_tabs, folder);

  // Write everything to a markdown file.
  return {
    title: title,
    id: yaml.id,
    contents: `---
${dump(yaml)}
--- 
import { Tabs, TabItem } from '@astrojs/starlight/components';

${md_text_with_tabs_and_samples}`
  }
}

function substituteTabs(contents: string) {
  return contents.replaceAll("{% tab proto %}", "<Tabs>\n  <TabItem label=\"Protocol Buffer\">")
                 .replaceAll("{% tab oas %}", "  </TabItem>\n  <TabItem label=\"OpenAPI 3.0\">")
                 .replaceAll("{% endtabs %}", "  </TabItem>\n<\Tabs>");
}

function substituteSamples(contents: string, folder: string) {
  var sample_regex = /\{% sample '(.*)', '(.*)', '(.*)' %}/g
  var sample2_regex = /\{% sample '(.*)', '(.*)' %}/g

  
  let samples = []
  // TODO: Do actual sample parsing.
  const matches = contents.matchAll(sample_regex);
  for(var match of matches) {
    samples.push({'match': match[0], 'filename': match[1]})
  }

  const matches2 = contents.matchAll(sample2_regex);
  for(var match of matches2) {
    samples.push({'match': match[0], 'filename': match[1]})
  }

  for(var sample of samples) {
    const sample_contents = readSample(folder, sample.filename)
    let formatted_sample = `
      \`\`\`
      ${sample_contents}
      \`\`\`
    `
    contents.replace(sample.match, formatted_sample)
  }

  return contents
}

function writeMarkdown(aep: AEP) {
  const filePath = path.join("src/content/docs", `${aep.id}.mdx`)
  fs.writeFileSync(filePath, aep.contents, {flag: "w"});
}

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


