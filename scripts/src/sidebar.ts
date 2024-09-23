import type { Sidebar, AEP, ConsolidatedLinterRule } from './types';

function buildLinterSidebar(rules: ConsolidatedLinterRule[]): Sidebar {
  return [
    {
    label: 'Tooling',
    items: [
      {
          'label': 'Protobuf Linter',
          'items': [
            'tooling/linter',
            {
              'label': 'Rules',
              'collapsed': true,
              'items': rules.map((x) => `tooling/linter/rules/${x.aep}`),
            }
          ]
        }
      ]
    }
  ];
}

function buildSidebar(aeps: AEP[], groups: any): Sidebar {
  let response = [{'label': 'Overview', 'items':[]}];

  for (var group of groups.categories) {
    response.push({
      'label': group.title,
      'items': aeps.filter((aep) => aep.category == group.code).sort((a1, a2) => a1.order > a2.order ? 1 : -1).map((aep) => ({label: `${aep.id}. ${aep.title}`, link: aep.slug}))
    })
  }
  return response as Sidebar;
}

function addToSidebar(sidebar: Sidebar, label: string, items: string[]): Sidebar {
  const targetGroupIndex = sidebar.findIndex(group => group.label === label);
  if (targetGroupIndex != -1) {
    if (Array.isArray(sidebar[targetGroupIndex].items)) {
      sidebar[targetGroupIndex].items.push(...items);
    } else {
      sidebar[targetGroupIndex].items = items;
    }
  }
  return sidebar;
}

export { buildSidebar, buildLinterSidebar, addToSidebar };