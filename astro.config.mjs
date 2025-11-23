import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import * as fs from "fs";
import rehypeMermaid from "rehype-mermaid";
import starlightBlog from "starlight-blog";
import starlightSidebarTopics from "starlight-sidebar-topics";
import tailwindcss from "@tailwindcss/vite";
import { assembleSidebarsByEdition } from "./src/utils/sidebar-from-site-structure.ts";

// Helper function to check if an edition is the latest
const isLatestEdition = (edition) => edition.folder === ".";

// Load configuration files
let siteStructure = JSON.parse(
  fs.readFileSync("generated/site-structure.json"),
);
let redirects = JSON.parse(fs.readFileSync("generated/redirects.json"));
let config = JSON.parse(fs.readFileSync("generated/config.json"));
let aepEditions = JSON.parse(fs.readFileSync("aep-editions.json"));

// Build sidebars for each edition from the site structure
const sidebarsByEdition = assembleSidebarsByEdition(siteStructure);

// Get the default sidebar (for the "general" edition with folder ".")
const defaultSidebar = sidebarsByEdition["general"] || [];

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
            icon: "open-book",
            items: defaultSidebar,
            badge: { text: "2028 Preview", variant: "tip" },
          },
          ...aepEditions.editions
            .filter((edition) => !isLatestEdition(edition))
            .map((edition) => {
              const editionSidebar =
                sidebarsByEdition[edition.folder] || defaultSidebar;
              return {
                label: `AEP ${edition.name.includes("2026") ? "2026 Edition" : edition.name}`,
                link: `/${edition.folder}/`,
                icon: "seti:clock",
                items: editionSidebar,
                badge: { text: "Archived", variant: "caution" },
                matcher(path, locale) {
                  return (
                    path === `/${edition.folder}` ||
                    path.startsWith(`/${edition.folder}/`)
                  );
                },
              };
            }),
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
