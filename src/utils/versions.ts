interface Edition {
  name: string;
  folder: string;
}

interface EditionsConfig {
  editions: Edition[];
}

export function isLatestEdition(edition: Edition | undefined): boolean {
  return edition?.folder === ".";
}

export function getEditionFromPath(
  editionsConfig: EditionsConfig,
  currentPath: string,
): Edition | undefined {
  const pathSegments = currentPath.split("/").filter(Boolean);

  for (const edition of editionsConfig.editions) {
    if (
      isLatestEdition(edition) &&
      !pathSegments.some((segment) =>
        editionsConfig.editions.some((e) => e.folder === segment),
      )
    ) {
      return edition;
    }

    if (!isLatestEdition(edition) && pathSegments.includes(edition.folder)) {
      return edition;
    }
  }

  return editionsConfig.editions.find((e) => isLatestEdition(e));
}

export function getVersionedPath(
  editionsConfig: EditionsConfig,
  currentPath: string,
  targetEdition: Edition,
): string {
  const pathSegments = currentPath.split("/").filter(Boolean);

  const currentEdition = getEditionFromPath(editionsConfig, currentPath);

  if (currentEdition && !isLatestEdition(currentEdition)) {
    const editionIndex = pathSegments.indexOf(currentEdition.folder);
    if (editionIndex !== -1) {
      pathSegments.splice(editionIndex, 1);
    }
  }

  if (!isLatestEdition(targetEdition)) {
    pathSegments.unshift(targetEdition.folder);
  }

  return "/" + pathSegments.join("/");
}

export function isVersionedPage(path: string): boolean {
  const segments = path.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  // Show version selector on AEP pages (ending with numbers) and AepList pages (ending with "general")
  return /^\d+$/.test(lastSegment) || lastSegment === "general";
}
