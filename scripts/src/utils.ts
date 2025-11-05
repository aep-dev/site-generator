import * as fs from "fs";
import * as path from "path";

/**
 * Logs file read operations
 */
export function logFileRead(filePath: string, source: string = "unknown") {
  console.log(`📖 Reading file: ${filePath} (source: ${source})`);
}

/**
 * Logs file write operations
 */
export function logFileWrite(filePath: string, size?: number) {
  const sizeInfo = size ? ` (${size} bytes)` : "";
  console.log(`📝 Writing file: ${filePath}${sizeInfo}`);
}

/**
 * Extracts the title from markdown content (first H1)
 */
export function getTitle(contents: string): string {
  var title_regex = /# (.*)\n/;
  const matches = contents.match(title_regex);
  return matches[1]!.replaceAll(":", "-").replaceAll("`", "");
}

/**
 * Writes a file to disk, creating directories as needed
 */
export function writeFile(filePath: string, contents: string) {
  const outDir = path.dirname(filePath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  logFileWrite(filePath, contents.length);
  fs.writeFileSync(filePath, contents, { flag: "w" });
}

/**
 * Gets all folders in a directory
 */
export async function getFolders(dirPath: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  const folders = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dirPath, entry.name));

  return folders;
}
