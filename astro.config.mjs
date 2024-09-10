import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import * as fs from 'fs';
import tailwind from "@astrojs/tailwind";
let sidebar = JSON.parse(fs.readFileSync("generated/sidebar.json"));
let linter_sidebar = JSON.parse(fs.readFileSync("generated/linter_sidebar.json"));
let redirects = JSON.parse(fs.readFileSync("generated/redirects.json"));


// https://astro.build/config
export default defineConfig({
  site: 'https://aep-dev.github.io',
  base: 'site-generator-beta'
  redirects: redirects,
  integrations: [starlight({
    title: 'AEP',
    customCss: [
      './src/tailwind.css',   
    ],
    social: {
      github: 'https://github.com/withastro/starlight'
    },
    sidebar: sidebar.concat(linter_sidebar)
  }),
  tailwind({
    applyBaseStyles: false,
  })]
});
