/**
 * Utility functions for fetching AEP content from different editions.
 */

import fs from "fs";
import path from "path";

interface Edition {
  name: string;
  folder: string;
}

export interface AEPContent {
  raw: string;
  frontmatter: Record<string, any>;
  body: string;
}

/**
 * Fetches the raw MDX content for an AEP from a specific edition.
 */
export async function getAEPContent(
  aepId: string,
  edition: Edition,
): Promise<AEPContent | null> {
  try {
    // Determine the file path based on edition
    const basePath = process.cwd();
    let filePath: string;

    if (edition.folder === ".") {
      // Latest edition - files are in root of docs
      filePath = path.join(basePath, "src", "content", "docs", `${aepId}.mdx`);
    } else {
      // Non-latest edition - files are in edition subfolder
      filePath = path.join(
        basePath,
        "src",
        "content",
        "docs",
        edition.folder,
        `${aepId}.mdx`,
      );
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return null;
    }

    // Read the file
    const raw = fs.readFileSync(filePath, "utf-8");

    // Parse frontmatter (simple extraction)
    const { frontmatter, body } = parseMDX(raw);

    return { raw, frontmatter, body };
  } catch (error) {
    console.error(
      `Error fetching AEP ${aepId} from edition ${edition.name}:`,
      error,
    );
    return null;
  }
}

/**
 * Simple frontmatter parser for MDX files.
 */
function parseMDX(content: string): {
  frontmatter: Record<string, any>;
  body: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterText = match[1];
  const body = match[2];

  // Parse YAML-like frontmatter (simple key-value pairs)
  const frontmatter: Record<string, any> = {};
  const lines = frontmatterText.split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.substring(1, value.length - 1);
      }

      frontmatter[key] = value;
    }
  }

  return { frontmatter, body };
}

/**
 * Checks if an AEP exists in a given edition.
 */
export async function aepExistsInEdition(
  aepId: string,
  edition: Edition,
): Promise<boolean> {
  const content = await getAEPContent(aepId, edition);
  return content !== null;
}

/**
 * Gets the list of editions where an AEP exists.
 */
export async function getAEPEditions(
  aepId: string,
  allEditions: Edition[],
): Promise<Edition[]> {
  const availableEditions: Edition[] = [];

  for (const edition of allEditions) {
    if (await aepExistsInEdition(aepId, edition)) {
      availableEditions.push(edition);
    }
  }

  return availableEditions;
}
