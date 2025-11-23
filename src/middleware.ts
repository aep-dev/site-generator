import { defineMiddleware } from "astro:middleware";
import * as fs from "fs";

interface Edition {
  name: string;
  folder: string;
}

interface EditionsConfig {
  editions: Edition[];
}

// Load editions config
const aepEditions: EditionsConfig = JSON.parse(
  fs.readFileSync("aep-editions.json", "utf-8"),
);

/**
 * Detect which edition is being viewed based on the URL path
 */
function getEditionFromPath(pathname: string): string {
  // Check if path starts with an edition folder
  for (const edition of aepEditions.editions) {
    if (edition.folder && edition.folder !== ".") {
      if (
        pathname === `/${edition.folder}` ||
        pathname.startsWith(`/${edition.folder}/`)
      ) {
        return edition.folder;
      }
    }
  }

  // Default to "general" edition (folder ".")
  return "general";
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Detect edition from the current path
  const editionFolder = getEditionFromPath(context.url.pathname);

  // Store edition in locals for components to access
  context.locals.edition = editionFolder;

  return next();
});
