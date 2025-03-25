#!/bin/bash
# a development script to generate and serve the site.

export AEP_LINTER_LOC=${AEP_LINTER_LOC:-"../api-linter"}
export AEP_LOCATION=${AEP_LOCATION:-"../aeps"}
export AEP_COMPONENTS_LOC=${AEP_COMPONENTS_LOC:-"../aep-components"}
npm run generate
npm run astro dev