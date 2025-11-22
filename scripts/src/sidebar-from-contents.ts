import type { Contents } from "./page-contents";
import type { Sidebar } from "./types";

/**
 * Assembles a complete sidebar structure from a Contents object
 */
function assembleSidebarFromContents(contents: Contents): Sidebar[] {
  const sidebar: Sidebar[] = [
    {
      label: "Overview",
      link: "1",
      icon: "bars",
      id: "overview",
      items: assembleOverviewItems(contents),
    },
    {
      label: "AEPs",
      link: "/general",
      icon: "open-book",
      id: "aeps",
      items: assembleAEPItems(contents),
    },
    {
      label: "Tooling",
      link: "/tooling-and-ecosystem",
      icon: "puzzle",
      id: "tooling",
      items: assembleToolingItems(contents),
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
 * Assemble overview section items from contents
 */
function assembleOverviewItems(contents: Contents): any[] {
  return contents.overview.pages.map((page) => page.link);
}

/**
 * Assemble AEP section items from contents
 */
function assembleAEPItems(contents: Contents): any[] {
  const items: any[] = [];

  // Get the main edition (assuming it's the one without a special name or "general")
  // For now, we'll process all editions and use the first one as the main one
  const editionNames = Object.keys(contents.aeps.editions);

  if (editionNames.length === 0) {
    return items;
  }

  // Use the first edition (or look for "general"/"main")
  const mainEditionName = editionNames.find((name) =>
    ["general", "main", "default"].includes(name.toLowerCase()),
  ) || editionNames[0];

  const mainEdition = contents.aeps.editions[mainEditionName];

  // Build items from categories
  for (const category of mainEdition.categories) {
    items.push({
      label: category.title,
      items: category.aeps.map((aep) => ({
        label: `${aep.id}. ${aep.title}`,
        link: aep.id,
      })),
    });
  }

  return items;
}

/**
 * Assemble tooling section items from contents
 */
function assembleToolingItems(contents: Contents): any[] {
  const items: any[] = [];

  // Add regular tooling pages
  for (const page of contents.tooling.pages) {
    items.push({
      label: page.label,
      link: page.link,
    });
  }

  // Add Protobuf Linter section if we have linter rules
  if (contents.tooling.linterRules && contents.tooling.linterRules.length > 0) {
    items.push({
      label: "Protobuf Linter",
      items: [
        "tooling/linter",
        {
          label: "Rules",
          collapsed: true,
          items: contents.tooling.linterRules.map(
            (rule) => `tooling/linter/rules/${rule}`,
          ),
        },
      ],
    });
  }

  // Add OpenAPI Linter section if we have OpenAPI linter rules
  if (
    contents.tooling.openAPILinterRules &&
    contents.tooling.openAPILinterRules.length > 0
  ) {
    items.push({
      label: "OpenAPI Linter",
      items: [
        "tooling/openapi-linter",
        {
          label: "Rules",
          collapsed: true,
          items: contents.tooling.openAPILinterRules.map(
            (rule) => `tooling/openapi-linter/rules/${rule}`,
          ),
        },
      ],
    });
  }

  return items;
}

export { assembleSidebarFromContents };
