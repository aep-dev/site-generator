#!/usr/bin/env bash
set -x
export SG_DIRECTOR="${PWD}"
export AEP_LOCATION="/tmp/aeps"
export AEP_LINTER_LOC="/tmp/api-linter"
export AEP_OPENAPI_LINTER_LOC="/tmp/aep-openapi-linter"
export AEP_COMPONENTS_LOC="/tmp/aep-components"
export AEP_EDITION_2026="/tmp/aeps-2026"

if [ ! -d "${AEP_LOCATION}" ]; then
    git clone https://github.com/aep-dev/aeps.git "${AEP_LOCATION}"
fi

if [ ! -d "${AEP_LINTER_LOC}" ]; then
    git clone https://github.com/aep-dev/api-linter.git "${AEP_LINTER_LOC}"
fi

if [ ! -d "${AEP_OPENAPI_LINTER_LOC}" ]; then
    git clone https://github.com/aep-dev/aep-openapi-linter.git "${AEP_OPENAPI_LINTER_LOC}"
fi

if [ ! -d "${AEP_COMPONENTS}" ]; then
    git clone https://github.com/aep-dev/aep-components.git "${AEP_COMPONENTS_LOC}"
fi

if [ ! -d "${AEP_EDITION_2026}" ]; then
    git clone https://github.com/aep-dev/aeps.git "${AEP_EDITION_2026}"
    # TODO: Checkout the repo at a specific tag or branch for the 2026 edition
fi

npm install
npx playwright install --with-deps chromium
npm run generate
npm run build
