# AEP Site Generator

## Overview

The AEP Site Generator takes in all of our documentation from multiple
repositories and generates the AEP website.

The site generator is made of multiple parts:

* A CI workflow
* A generator script that reads the various repos + converts their
  documentation to formats supported by Starlight
* A (very standard) [Starlight](https://starlight.astro.build) website.

## Generator

The generator script reads documentation from all of the repos and writes files
for Starlight to read.

At a high level, the generator script writes out Markdown / MDX (Markdown with
React added) files to src/content/docs for Starlight to read. It also generates
various JSON files in generated/ to build the sidebar and other config.

## 🚀 Starlight Project Structure

```
.
├── public/
├── scripts/
│   ├── generate.ts
├── src/
│   ├── assets/
│   ├── content/
│   │   ├── docs/
│   │   └── config.ts
│   └── env.d.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory. Each file is exposed as a route based on its file name.

Images can be added to `src/assets/` and embedded in Markdown with a relative link.

Static assets, like favicons, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

