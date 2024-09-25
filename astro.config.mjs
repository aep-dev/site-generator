import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import * as fs from 'fs';
import tailwind from "@astrojs/tailwind";
import { Graphviz } from "@hpcc-js/wasm";
import rehypeGraphviz from "rehype-graphviz";
import { VitePluginRadar } from 'vite-plugin-radar';


let sidebar = JSON.parse(fs.readFileSync("generated/sidebar.json"));
let linter_sidebar = JSON.parse(fs.readFileSync("generated/linter_sidebar.json"));
let redirects = JSON.parse(fs.readFileSync("generated/redirects.json"));
let config = JSON.parse(fs.readFileSync("generated/config.json"));


// https://astro.build/config
export default defineConfig({
  site: 'https://beta.aep.dev',
  redirects: redirects,
  markdown: {
    rehypePlugins: [[rehypeGraphviz, { graphviz: await Graphviz.load() }]],
  },
  integrations: [starlight({
    title: 'AEP',
    customCss: [
      './src/tailwind.css',
    ],
    social: {
      github: config.urls.repo,
    },
    // Google Analytics tag.
    sidebar: sidebar.concat(linter_sidebar)
  }),
  tailwind({
    applyBaseStyles: false,
  })],
  vite: {
    plugins: [
      VitePluginRadar({
        analytics: {
          id: config.site.ga_tag
        },
        gtm: {
          id: config.site.ga_tag
        },
      }),
    ],
  }
});
