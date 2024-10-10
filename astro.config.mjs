import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import * as fs from 'fs';
import tailwind from "@astrojs/tailwind";
import { Graphviz } from "@hpcc-js/wasm";
import rehypeGraphviz from "rehype-graphviz";
import { VitePluginRadar } from 'vite-plugin-radar';


let sidebar = JSON.parse(fs.readFileSync("generated/sidebar.json"));
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
    sidebar: sidebar,
    components: {
      'Head': './src/components/overrides/Head.astro',
      'SkipLink': './src/components/overrides/SkipLink.astro'
    }
  }),
  tailwind({
    applyBaseStyles: false,
  })],
});
