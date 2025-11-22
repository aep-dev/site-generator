import * as fs from "fs";
import * as path from "path";
import type { AEP } from "../../scripts/src/types";

/**
 * Represents a single page item in the navigation
 */
interface PageItem {
  label: string;
  link: string;
}

/**
 * Represents a category of AEPs
 */
interface AEPCategory {
  code: string;
  title: string;
  aeps: AEPItem[];
}

/**
 * Individual AEP item
 */
interface AEPItem {
  id: string;
  title: string;
  slug: string;
  status?: string;
  category: string;
  order: number;
}

/**
 * Overview section containing general pages
 */
interface OverviewSection {
  pages: PageItem[];
}

/**
 * Tooling section containing linter and other tool pages
 */
interface ToolingSection {
  pages: PageItem[];
  linterRules?: string[];
  openAPILinterRules?: string[];
}

/**
 * Edition information for AEPs
 */
interface Edition {
  name: string;
  folder?: string;
  categories: AEPCategory[];
}

/**
 * AEPs section containing editions and categories
 */
interface AEPsSection {
  editions: {
    [editionName: string]: Edition;
  };
}

/**
 * Top-level site structure representing all content organization
 */
interface SiteStructure {
  overview: OverviewSection;
  aeps: AEPsSection;
  tooling: ToolingSection;
}

/**
 * Write site structure to a JSON file
 */
function writeSiteStructure(
  siteStructure: SiteStructure,
  outputPath: string,
): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const json = JSON.stringify(siteStructure, null, 2);
  fs.writeFileSync(outputPath, json, "utf-8");
  console.log(`✓ Wrote site structure to ${outputPath}`);
}

/**
 * Create an empty SiteStructure
 */
function createEmptySiteStructure(): SiteStructure {
  return {
    overview: {
      pages: [],
    },
    aeps: {
      editions: {},
    },
    tooling: {
      pages: [],
    },
  };
}

/**
 * Add a page to the overview section
 */
function addOverviewPage(
  siteStructure: SiteStructure,
  page: PageItem,
): SiteStructure {
  siteStructure.overview.pages.push(page);
  return siteStructure;
}

/**
 * Add a page to the tooling section
 */
function addToolingPage(
  siteStructure: SiteStructure,
  page: PageItem,
): SiteStructure {
  siteStructure.tooling.pages.push(page);
  return siteStructure;
}

/**
 * Add linter rules to the tooling section
 */
function addLinterRules(
  siteStructure: SiteStructure,
  rules: string[],
): SiteStructure {
  siteStructure.tooling.linterRules = rules;
  return siteStructure;
}

/**
 * Add OpenAPI linter rules to the tooling section
 */
function addOpenAPILinterRules(
  siteStructure: SiteStructure,
  rules: string[],
): SiteStructure {
  siteStructure.tooling.openAPILinterRules = rules;
  return siteStructure;
}

/**
 * Build AEP categories from a list of AEPs
 */
function buildAEPCategories(
  aeps: AEP[],
  groups: { categories: { code: string; title: string }[] },
): AEPCategory[] {
  const categories: AEPCategory[] = [];

  for (const group of groups.categories) {
    const categoryAEPs = aeps
      .filter((aep) => aep.category === group.code)
      .sort((a, b) => a.order - b.order)
      .map((aep) => ({
        id: aep.id,
        title: aep.title,
        slug: aep.slug,
        status: (aep.frontmatter as any).state as string | undefined,
        category: aep.category,
        order: aep.order,
      }));

    if (categoryAEPs.length > 0) {
      categories.push({
        code: group.code,
        title: group.title,
        aeps: categoryAEPs,
      });
    }
  }

  return categories;
}

/**
 * Add an edition of AEPs to the site structure
 */
function addAEPEdition(
  siteStructure: SiteStructure,
  editionName: string,
  aeps: AEP[],
  groups: { categories: { code: string; title: string }[] },
  folder?: string,
): SiteStructure {
  const categories = buildAEPCategories(aeps, groups);

  siteStructure.aeps.editions[editionName] = {
    name: editionName,
    folder,
    categories,
  };

  return siteStructure;
}

/**
 * Get the latest edition name from a site structure.
 * The latest edition is determined by:
 * 1. Edition with folder = "." (current directory)
 * 2. Edition named "general", "main", or "default"
 * 3. First edition in the list
 */
function getLatestEditionName(siteStructure: SiteStructure): string | null {
  const editionNames = Object.keys(siteStructure.aeps.editions);

  if (editionNames.length === 0) {
    return null;
  }

  // Check for edition with folder = "."
  const currentFolderEdition = editionNames.find(
    (name) => siteStructure.aeps.editions[name].folder === ".",
  );
  if (currentFolderEdition) {
    return currentFolderEdition;
  }

  // Check for standard names
  const standardEdition = editionNames.find((name) =>
    ["general", "main", "default"].includes(name.toLowerCase()),
  );
  if (standardEdition) {
    return standardEdition;
  }

  // Fall back to first edition
  return editionNames[0];
}

export type {
  SiteStructure,
  OverviewSection,
  AEPsSection,
  ToolingSection,
  PageItem,
  AEPCategory,
  AEPItem,
  Edition,
};

export {
  writeSiteStructure,
  createEmptySiteStructure,
  addOverviewPage,
  addToolingPage,
  addLinterRules,
  addOpenAPILinterRules,
  addAEPEdition,
  buildAEPCategories,
  getLatestEditionName,
};
