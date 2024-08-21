import * as fs from 'fs';
import * as path from 'path';

const AEP_LOC = process.env.AEP_LOCATION!;

async function getFolders(dirPath: string): Promise<string[]> {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  
    const folders = entries
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(dirPath, entry.name));
  
    return folders;
}

const aep_folders = await getFolders(path.join(AEP_LOC, "aep/general/"));
console.log(aep_folders);


