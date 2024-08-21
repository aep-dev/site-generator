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

function createMarkdown(files: string[]): AEP {
  const md_text = files[0];
  const yaml_text = files[1];

  const yaml = load(yaml_text);

  // Add title to yaml
  var title_regex = /^# (.*)\n/
  const matches = md_text.match(title_regex);
  const title = matches[1]!;

  yaml.title = title;

  // Write everything to a markdown file.
  return {
    title: title,
    id: yaml.id,
    contents: `---
${dump(yaml)}
--- 
${md_text}`
  }
}

function writeMarkdown(aep: AEP) {
  const filePath = path.join("../src/content/docs", `${aep.id}.md`)
  console.log(filePath);
  // fs.writeFileSync(filePath, aep.contents);
}

const aep_folders = await getFolders(path.join(AEP_LOC, "aep/general/"));
for(var folder of aep_folders) {
  try {
    const files = readAEP(folder);
    const new_file = createMarkdown(files);
    writeMarkdown(new_file);
  }
  catch(e) {
    console.log(`AEP ${folder} failed with error ${e}`)
  }
}


