# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

| Command                                       | Description                                                |
| --------------------------------------------- | ---------------------------------------------------------- |
| `npm install`                                 | Install dependencies                                       |
| `npm run dev`                                 | Start local development server at localhost:4321           |
| `npm run build`                               | Build production site to ./dist/                           |
| `npm run preview`                             | Preview build locally                                      |
| `npm run generate`                            | Run generator script to create content from external repos |
| `npm test`                                    | Run test suite using tsx                                   |
| `npx playwright install --with-deps chromium` | Install Playwright with Chromium for testing               |

## Local Development Setup

The site generator requires external repositories to be cloned and referenced via environment variables:

```bash
export AEP_LOCATION="../aeps"           # Main AEP documentation repo
export AEP_LINTER_LOC="../api-linter"  # API linter rules repo
export AEP_COMPONENTS_LOC="../aep-components"  # Components repo
npm run generate
npm run dev
```

Use `./scripts/serve.sh` as a convenience script if repos are in sibling directories.

## Architecture Overview

This is a two-stage site generator built on Astro and Starlight:

### Stage 1: Generator (`scripts/generate.ts`)

- Reads documentation from multiple external repos (aeps, api-linter, aep-components)
- Transforms AEP content (formatted as Markdown with Jinja2) and custom syntax into MDX
- Generates sidebar configuration and navigation
- Outputs processed files to `src/content/docs/` and `generated/`

### Stage 2: Starlight Site

- Standard Astro/Starlight setup with custom components
- Reads generated MDX files and JSON configuration
- Produces static site with navigation, search, and theming

### Key Components

**Generator Scripts (`scripts/src/`):**

- `generate.ts` - Main orchestration script
- `markdown.ts` - Markdown transformation pipeline with custom syntax handling
- `sidebar.ts` - Navigation structure generation
- `types.ts` - TypeScript definitions for AEPs, configs, and content

**Astro Components (`src/components/`):**

- `Sample.astro` - Code sample rendering with syntax highlighting
- `AepList.astro` - Dynamic AEP listing by category
- `HomeGrid.astro` - Homepage layout grid
- `overrides/` - Custom Starlight component overrides

**Content Processing:**

- Converts Jinja2 templates (`aep.md.j2`) to MDX
- Transforms custom syntax (tabs, callouts, samples) to Starlight components
- Processes AEP metadata from YAML frontmatter
- Generates redirects and cross-references

### Content Structure

- `src/content/docs/` - All site content (generated, not edited directly)
- `generated/` - JSON files for sidebar, redirects, and configuration
- `public/json-schema/` - Generated JSON schemas from components repo

## Key Files

- `astro.config.mjs` - Astro configuration with Starlight plugins
- `scripts/generate.ts` - Main generator that processes external repos
- `src/content.config.ts` - Content collection schema with AEP extensions
- `tailwind.config.mjs` - Tailwind CSS configuration

## Testing

Run tests with `npm test`. Tests use a custom test runner and cover:

- Sample code extraction and formatting
- YAML processing with JSONPath queries
- Error handling for invalid content

## Content Generation Flow

1. Clone external repos (aeps, api-linter, aep-components)
2. Run `npm run generate` to process all content
3. Generator reads YAML configs and Jinja2 templates
4. Transforms content through markdown pipeline
5. Outputs MDX files and JSON configs
6. Generates `public/llms.txt` with all AEP contents for LLM consumption
7. Astro builds static site from generated content

## Generated Files

- `src/content/docs/` - Site content (MDX files)
- `generated/` - JSON configuration files (sidebar, redirects, etc.)
- `public/llms.txt` - Consolidated AEP content for LLM training/reference
- `public/json-schema/` - JSON schemas from components repo
