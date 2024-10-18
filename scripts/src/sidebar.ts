import type { Sidebar, AEP, ConsolidatedLinterRule } from './types';

function buildLinterSidebar(rules: ConsolidatedLinterRule[], sidebar: Sidebar): Sidebar {
  let contents = [
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
  return addToSidebar(sidebar, "Tooling", contents);
}

function buildSidebar(aeps: AEP[], groups: any, sidebar: Sidebar): Sidebar {
  let response = [];
  for (var group of groups.categories) {
    response.push({
      'label': group.title,
      'items': aeps.filter((aep) => aep.category == group.code).sort((a1, a2) => a1.id > a2.id ? 1 : -1).map((aep) => ({label: `${aep.id}. ${aep.title}`, link: aep.id.toString()}))
    })
  }
  
  return addToSidebar(sidebar, "AEPs", response);
}

function addToSidebar(sidebar: Sidebar, label: string, items): Sidebar {
  const targetGroupIndex = sidebar.findIndex(group => group.label === label);
  if (targetGroupIndex != -1) {
    if (Array.isArray(sidebar[targetGroupIndex].items)) {
      sidebar[targetGroupIndex].items.push(...items);
    } else {
      sidebar[targetGroupIndex].items = items;
    }
  } else {
    sidebar.push({'label': label, items: items})
  }
  return sidebar;
}

export { buildSidebar, buildLinterSidebar, addToSidebar };