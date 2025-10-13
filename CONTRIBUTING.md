# Contributing

## Prerequisites

Before following any other part of the guide, install the following:

- [npm](https://www.npmjs.com/)
- playwright with chromium: `npx playwright install --with-deps chromium`

## Local Development Quickstart

```
# clone the aeps and api-linter repositories, and point to their location
export AEP_LINTER_LOC=${AEP_LINTER_LOC:-"../api-linter"}
export AEP_LOCATION=${AEP_LOCATION:-"../aeps"}
export AEP_COMPONENTS_LOC=${AEP_COMPONENTS_LOC:-"../aep-components"}
# generate the pages required for the astro build
npm run generate
# build and run the astro site
npm run astro build
```

If your aeps and api-linter repositories are in sibling directories of your
site-generator, you can use the following utility script:

```bash
./scripts/serve.sh
```
