import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import * as fs from "fs";
import rehypeMermaid from "rehype-mermaid";
import starlightBlog from "starlight-blog";
import starlightSidebarTopics from "starlight-sidebar-topics";
import tailwindcss from "@tailwindcss/vite";
import {
  assembleSidebarsByEdition,
  readSiteStructure,
} from "./src/utils/sidebar-from-site-structure.ts";

// Load configuration files
let redirects = JSON.parse(fs.readFileSync("generated/redirects.json"));
let config = JSON.parse(fs.readFileSync("generated/config.json"));
let aepEditions = JSON.parse(fs.readFileSync("aep-editions.json"));

// Load site structure and build edition-specific sidebars
const siteStructure = readSiteStructure("generated/site-structure.json");
const sidebarsByEdition = assembleSidebarsByEdition(siteStructure);

// Helper to convert Sidebar[] to Starlight sidebar format (strip icon and id)
const toStarlightFormat = (sidebar) => {
  return sidebar.map((section) => ({
    label: section.label,
    ...(section.link && { link: section.link }),
    ...(section.items && { items: section.items }),
    ...(section.collapsed !== undefined && { collapsed: section.collapsed }),
  }));
};

// Get sidebars in Starlight format
const generalSidebar = toStarlightFormat(sidebarsByEdition["general"] || []);
const edition2026Sidebar = toStarlightFormat(
  sidebarsByEdition["aep-2026"] || generalSidebar,
);

// https://astro.build/config
export default defineConfig({
  site: "https://aep.dev",
  redirects: redirects,

  markdown: {
    rehypePlugins: [[rehypeMermaid, { dark: true }]],
  },

  integrations: [
    starlight({
      title: "AEP",
      customCss: [
        // Path to your Tailwind base styles:
        "./src/styles/global.css",
      ],
      plugins: [
        starlightBlog({ navigation: "none" }),
        starlightSidebarTopics([
          {
            label: "AEP",
            link: "/",
            items: generalSidebar,
          },
          {
            label: "AEP 2026 Edition",
            link: "/aep-2026/",
            items: edition2026Sidebar,
            matcher(path, locale) {
              return path === "/aep-2026" || path.startsWith("/aep-2026/");
            },
          },
        ]),
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
