#!/bin/bash
# a development script to generate and serve the site.

export API_LINTER_LOC=${API_LINTER_LOC:-"../api-linter"}
export AEP_LOCATION=${AEP_LOCATION:-"../aeps"}
npm run astro dev