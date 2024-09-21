import type { Sidebar, AEP, ConsolidatedLinterRule } from './types';

function buildLinterSidebar(rules: ConsolidatedLinterRule[]): Sidebar {
  return [
    {
    label: 'Tooling',
    items: [
      {
          'label': 'Linter',
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
  let response = [];

  for (var group of groups.categories) {
    response.push({
      'label': group.title,
      'items': aeps.filter((aep) => aep.category == group.code).sort((a1, a2) => a1.order > a2.order ? 1 : -1).map((aep) => aep.slug)
    })
  }
  return response as Sidebar;
}

export { buildSidebar, buildLinterSidebar };