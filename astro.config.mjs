import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import * as fs from 'fs';
import rehypeMermaid from "rehype-mermaid";
import starlightBlog from 'starlight-blog';
import starlightSidebarTopics from 'starlight-sidebar-topics';

import tailwindcss from '@tailwindcss/vite';

import tailwindcss from '@tailwindcss/vite';

let sidebar = JSON.parse(fs.readFileSync("generated/sidebar.json"));
let redirects = JSON.parse(fs.readFileSync("generated/redirects.json"));
let config = JSON.parse(fs.readFileSync("generated/config.json"));


// https://astro.build/config
export default defineConfig({
  site: 'https://aep.dev',
  redirects: redirects,

  markdown: {
    rehypePlugins: [
      [rehypeMermaid, { dark: true }],
    ],
  },

  integrations: [starlight({
    title: 'AEP',
    customCss: [
      // Path to your Tailwind base styles:
      './src/styles/global.css',
    ],
    plugins: [
      starlightBlog(
        {'navigation': 'none'}
      ),
      starlightSidebarTopics(sidebar, {'exclude': ['/blog', '/blog/**/*']}),
    ],
    social: [
      {icon: 'github', label: 'GitHub', href: config.urls.repo},
      {icon: 'blueSky', label: 'BlueSky', href: 'https://bsky.app/profile/aep.dev'},
      {icon: 'youtube', label: 'YouTube', href: 'https://youtube.com/@aepdev/videos'}
    ],
    components: {
      'Head': './src/components/overrides/Head.astro',
      'SkipLink': './src/components/overrides/SkipLink.astro',
      'TableOfContents': './src/components/overrides/TableOfContents.astro'
    }
  })],

  vite: {
    plugins: [tailwindcss()]
  }
});
