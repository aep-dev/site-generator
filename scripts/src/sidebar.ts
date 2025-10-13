import type { Sidebar, AEP, ConsolidatedLinterRule } from "./types";

function buildLinterSidebar(
  rules: ConsolidatedLinterRule[],
  sidebar: Sidebar[],
): Sidebar[] {
  let contents = [
    {
      label: "Protobuf Linter",
      items: [
        "tooling/linter",
        {
          label: "Rules",
          collapsed: true,
          items: rules.map((x) => `tooling/linter/rules/${x.aep}`),
        },
      ],
    },
  ];
  return addToSidebar(sidebar, "Tooling", contents);
}

/**
 * Builds sidebar entries for OpenAPI linter rules.
 *
 * @param rules Consolidated linter rules by AEP number
 * @param sidebar Existing sidebar structure
 * @returns Updated sidebar with OpenAPI linter entries
 */
function buildOpenAPILinterSidebar(
  rules: ConsolidatedLinterRule[],
  sidebar: Sidebar[],
): Sidebar[] {
  // Guard: Only add if we have rules to display
  if (rules.length === 0) {
    console.log("ℹ️  No OpenAPI linter rules to add to sidebar");
    return sidebar;
  }

  // Create rule items sorted by AEP number
  const ruleItems = rules
    .sort((a, b) => a.aep.localeCompare(b.aep))
    .map((rule) => `tooling/openapi-linter/rules/${rule.aep}`);

  let contents = [
    {
      label: "OpenAPI Linter",
      items: [
        "tooling/openapi-linter",
        {
          label: "Rules",
          collapsed: true, // Start collapsed for cleaner UI
          items: ruleItems,
        },
      ],
    },
  ];

  console.log(`✓ Added ${ruleItems.length} OpenAPI linter rules to sidebar`);
  return addToSidebar(sidebar, "Tooling", contents);
}

function buildSidebar(aeps: AEP[], groups: any, sidebar: Sidebar[]): Sidebar[] {
  let response = [];
  for (var group of groups.categories) {
    response.push({
      label: group.title,
      items: aeps
        .filter((aep) => aep.category == group.code)
        .sort((a1, a2) => (a1.id > a2.id ? 1 : -1))
        .map((aep) => ({
          label: `${aep.id}. ${aep.title}`,
          link: aep.id.toString(),
        })),
    });
  }

  return addToSidebar(sidebar, "AEPs", response);
}

function addToSidebar(sidebar: Sidebar[], label: string, items): Sidebar[] {
  const targetGroupIndex = sidebar.findIndex((group) => group.label === label);
  if (targetGroupIndex != -1) {
    if (Array.isArray(sidebar[targetGroupIndex].items)) {
      sidebar[targetGroupIndex].items.push(...items);
    } else {
      sidebar[targetGroupIndex].items = items;
    }
  } else {
    sidebar.push({ label: label, items: items });
  }
  return sidebar;
}

export {
  buildSidebar,
  buildLinterSidebar,
  buildOpenAPILinterSidebar,
  addToSidebar,
};
