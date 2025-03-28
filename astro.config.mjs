import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import * as fs from 'fs';
import tailwind from "@astrojs/tailwind";
import { Graphviz } from "@hpcc-js/wasm";
import rehypeGraphviz from "rehype-graphviz";
import rehypeMermaid from "rehype-mermaid";
import starlightBlog from 'starlight-blog';

let sidebar = JSON.parse(fs.readFileSync("generated/sidebar.json"));
let redirects = JSON.parse(fs.readFileSync("generated/redirects.json"));
let config = JSON.parse(fs.readFileSync("generated/config.json"));


// https://astro.build/config
export default defineConfig({
  site: 'https://aep.dev',
  redirects: redirects,
  markdown: {
    rehypePlugins: [
      [rehypeGraphviz, { graphviz: await Graphviz.load() }],
      [rehypeMermaid, { dark: true }],
    ],
  },
  integrations: [starlight({
    title: 'AEP',
    customCss: [
      './src/tailwind.css',
    ],
    plugins: [starlightBlog()],
    social: {
      github: config.urls.repo,
      blueSky: 'https://bsky.app/profile/aep.dev',
      youtube: 'https://youtube.com/@aepdev/videos',
    },
    sidebar: sidebar,
    components: {
      'Head': './src/components/overrides/Head.astro',
      'SkipLink': './src/components/overrides/SkipLink.astro',
      'TableOfContents': './src/components/overrides/TableOfContents.astro'
    }
  }),
  tailwind({
    applyBaseStyles: false,
  })],
});
