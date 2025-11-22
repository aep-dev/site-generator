import * as fs from "fs";
import * as path from "path";
import type { AEP } from "./types";

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
 * Top-level contents structure
 */
interface Contents {
  overview: OverviewSection;
  aeps: AEPsSection;
  tooling: ToolingSection;
}

/**
 * Write contents structure to a JSON file
 */
function writeContents(contents: Contents, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const json = JSON.stringify(contents, null, 2);
  fs.writeFileSync(outputPath, json, "utf-8");
  console.log(`✓ Wrote contents to ${outputPath}`);
}

/**
 * Create an empty Contents structure
 */
function createEmptyContents(): Contents {
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
function addOverviewPage(contents: Contents, page: PageItem): Contents {
  contents.overview.pages.push(page);
  return contents;
}

/**
 * Add a page to the tooling section
 */
function addToolingPage(contents: Contents, page: PageItem): Contents {
  contents.tooling.pages.push(page);
  return contents;
}

/**
 * Add linter rules to the tooling section
 */
function addLinterRules(contents: Contents, rules: string[]): Contents {
  contents.tooling.linterRules = rules;
  return contents;
}

/**
 * Add OpenAPI linter rules to the tooling section
 */
function addOpenAPILinterRules(contents: Contents, rules: string[]): Contents {
  contents.tooling.openAPILinterRules = rules;
  return contents;
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
 * Add an edition of AEPs to the contents
 */
function addAEPEdition(
  contents: Contents,
  editionName: string,
  aeps: AEP[],
  groups: { categories: { code: string; title: string }[] },
): Contents {
  const categories = buildAEPCategories(aeps, groups);

  contents.aeps.editions[editionName] = {
    name: editionName,
    categories,
  };

  return contents;
}

export type {
  Contents,
  OverviewSection,
  AEPsSection,
  ToolingSection,
  PageItem,
  AEPCategory,
  AEPItem,
  Edition,
};

export {
  writeContents,
  createEmptyContents,
  addOverviewPage,
  addToolingPage,
  addLinterRules,
  addOpenAPILinterRules,
  addAEPEdition,
  buildAEPCategories,
};
