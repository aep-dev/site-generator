import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import * as fs from "fs";
import rehypeMermaid from "rehype-mermaid";
import starlightBlog from "starlight-blog";
import starlightSidebarTopics from "starlight-sidebar-topics";
import tailwindcss from "@tailwindcss/vite";
import { starlightEditionAwareSidebar } from "./src/integrations/starlight-edition-aware-sidebar.ts";
import {
  assembleSidebarsByEdition,
  readSiteStructure,
} from "./src/utils/sidebar-from-site-structure.ts";

// Load configuration files
let redirects = JSON.parse(fs.readFileSync("generated/redirects.json"));
let config = JSON.parse(fs.readFileSync("generated/config.json"));
let aepEditions = JSON.parse(fs.readFileSync("aep-editions.json"));

// Load site structure and build sidebars for all editions
const siteStructure = readSiteStructure("generated/site-structure.json");
const sidebarsByEdition = assembleSidebarsByEdition(siteStructure);

// Get the default edition sidebar and strip icon/id for Starlight
const defaultSidebar = (sidebarsByEdition["general"] || []).map((item) => ({
  label: item.label,
  ...(item.link && { link: item.link }),
  ...(item.items && { items: item.items }),
  ...(item.collapsed !== undefined && { collapsed: item.collapsed }),
}));

// https://astro.build/config
export default defineConfig({
  site: "https://aep.dev",
  redirects: redirects,

  markdown: {
    rehypePlugins: [[rehypeMermaid, { dark: true }]],
  },

  integrations: [
    starlightEditionAwareSidebar(),
    starlight({
      title: "AEP",
      customCss: [
        // Path to your Tailwind base styles:
        "./src/styles/global.css",
      ],
      plugins: [
        starlightBlog({ navigation: "none" }),
        starlightSidebarTopics(defaultSidebar, {
          topics: {
            aeps: aepEditions.editions
              .filter((edition) => edition.folder !== ".")
              .flatMap((edition) => [
                `/${edition.folder}`,
                `/${edition.folder}/**/*`,
              ]),
          },
          exclude: [
            "/blog",
            "/blog/**/*",
            "/aep_list",
            ...aepEditions.editions
              .filter((edition) => edition.folder !== ".")
              .flatMap((edition) => [
                `/${edition.folder}`,
                `/${edition.folder}/**/*`,
              ]),
          ],
        }),
      ],
      social: [
        { icon: "github", label: "GitHub", href: config.urls.repo },
        {
          icon: "blueSky",
          label: "BlueSky",
          href: "https://bsky.app/profile/aep.dev",
        },
        {
          icon: "youtube",
          label: "YouTube",
          href: "https://youtube.com/@aepdev/videos",
        },
      ],
      components: {
        Banner: "./src/components/overrides/Banner.astro",
        Head: "./src/components/overrides/Head.astro",
        Sidebar: "./src/components/overrides/Sidebar.astro",
        SkipLink: "./src/components/overrides/SkipLink.astro",
        TableOfContents: "./src/components/overrides/TableOfContents.astro",
        ThemeSelect: "./src/components/overrides/ThemeSelect.astro",
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
