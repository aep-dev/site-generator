interface Edition {
  name: string;
  folder: string;
}

interface EditionsConfig {
  editions: Edition[];
}

export function getEditionFromPath(
  editionsConfig: EditionsConfig,
  currentPath: string,
): Edition | undefined {
  const pathSegments = currentPath.split("/").filter(Boolean);

  for (const edition of editionsConfig.editions) {
    if (
      edition.folder === "." &&
      !pathSegments.some((segment) =>
        editionsConfig.editions.some((e) => e.folder === segment),
      )
    ) {
      return edition;
    }

    if (edition.folder !== "." && pathSegments.includes(edition.folder)) {
      return edition;
    }
  }

  return editionsConfig.editions.find((e) => e.folder === ".");
}

export function getVersionedPath(
  editionsConfig: EditionsConfig,
  currentPath: string,
  targetEdition: Edition,
): string {
  const pathSegments = currentPath.split("/").filter(Boolean);

  const currentEdition = getEditionFromPath(editionsConfig, currentPath);

  if (currentEdition?.folder && currentEdition.folder !== ".") {
    const editionIndex = pathSegments.indexOf(currentEdition.folder);
    if (editionIndex !== -1) {
      pathSegments.splice(editionIndex, 1);
    }
  }

  if (targetEdition.folder !== ".") {
    pathSegments.unshift(targetEdition.folder);
  }

  return "/" + pathSegments.join("/");
}

export function isVersionedPage(path: string): boolean {
  const segments = path.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  return /^\d+$/.test(lastSegment);
}
