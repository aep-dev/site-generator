import * as fs from "fs";
import { getLatestEditionName, type SiteStructure } from "./site-structure";
import type { Sidebar } from "../../scripts/src/types";

/**
 * Read site structure from a JSON file
 */
function readSiteStructure(inputPath: string): SiteStructure {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Site structure file not found: ${inputPath}`);
  }

  const json = fs.readFileSync(inputPath, "utf-8");
  const siteStructure = JSON.parse(json) as SiteStructure;
  console.log(`✓ Read site structure from ${inputPath}`);
  return siteStructure;
}

/**
 * Assembles a complete sidebar structure from a SiteStructure object
 */
function assembleSidebarFromSiteStructure(
  siteStructure: SiteStructure,
): Sidebar[] {
  const sidebar: Sidebar[] = [
    {
      label: "Overview",
      link: "1",
      icon: "bars",
      id: "overview",
      items: assembleOverviewItems(siteStructure),
    },
    {
      label: "AEPs",
      link: "/aep_list",
      icon: "open-book",
      id: "aeps",
      items: assembleAEPItems(siteStructure),
    },
    {
      label: "Tooling",
      link: "/tooling-and-ecosystem",
      icon: "puzzle",
      id: "tooling",
      items: assembleToolingItems(siteStructure),
    },
    {
      label: "Blog",
      link: "/blog",
      icon: "document",
      id: "blog",
      items: [],
    },
  ];

  return sidebar;
}

/**
 * Assemble overview section items from site structure
 */
function assembleOverviewItems(siteStructure: SiteStructure): any[] {
  return siteStructure.overview.pages.map((page) => page.link);
}

/**
 * Assemble AEP section items from site structure
 */
function assembleAEPItems(siteStructure: SiteStructure): any[] {
  const items: any[] = [];
  const latestEditionName = getLatestEditionName(siteStructure);

  if (!latestEditionName) {
    return items;
  }

  const latestEdition = siteStructure.aeps.editions[latestEditionName];

  // Build items from categories
  for (const category of latestEdition.categories) {
    items.push({
      label: category.title,
      items: category.aeps.map((aep) => ({
        label: `${aep.id}. ${aep.title}`,
        link: aep.id.toString(),
      })),
    });
  }

  return items;
}

/**
 * Assemble tooling section items from site structure
 */
function assembleToolingItems(siteStructure: SiteStructure): any[] {
  const items: any[] = [];

  // Add regular tooling pages
  for (const page of siteStructure.tooling.pages) {
    items.push({
      label: page.label,
      link: page.link,
    });
  }

  // Add Protobuf Linter section
  if (
    siteStructure.tooling.linterRules &&
    siteStructure.tooling.linterRules.length > 0
  ) {
    items.push({
      label: "Protobuf Linter",
      collapsed: true,
      items: [
        "tooling/linter",
        {
          label: "Rules",
          collapsed: true,
          items: siteStructure.tooling.linterRules.map(
            (rule) => `tooling/linter/rules/${rule}`,
          ),
        },
      ],
    });
  }

  // Add OpenAPI Linter section
  if (
    siteStructure.tooling.openAPILinterRules &&
    siteStructure.tooling.openAPILinterRules.length > 0
  ) {
    items.push({
      label: "OpenAPI Linter",
      collapsed: true,
      items: [
        "tooling/openapi-linter",
        {
          label: "Rules",
          collapsed: true,
          items: siteStructure.tooling.openAPILinterRules
            .sort((a, b) => a.localeCompare(b))
            .map((rule) => `tooling/openapi-linter/rules/${rule}`),
        },
      ],
    });
  }

  return items;
}

export { readSiteStructure, assembleSidebarFromSiteStructure };
