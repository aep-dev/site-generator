import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import * as fs from 'fs';
import tailwind from "@astrojs/tailwind";
let sidebar = JSON.parse(fs.readFileSync("generated/sidebar.json"));
let linter_sidebar = JSON.parse(fs.readFileSync("generated/linter_sidebar.json"));
let redirects = JSON.parse(fs.readFileSync("generated/redirects.json"));
let config = JSON.parse(fs.readFileSync("generated/config.json"));


// https://astro.build/config
export default defineConfig({
  site: 'https://beta.aep.dev',
  redirects: redirects,
  integrations: [starlight({
    title: 'AEP',
    customCss: [
      './src/tailwind.css',   
    ],
    social: {
      github: config.urls.repo,
    },
    // Google Analytics tag.
    head: [    
      {      
        tag: 'script',      
        attrs: {        
          src: `<https://www.googletagmanager.com/gtag/js?id=${config.site.ga_tag}>`,
          async: true,      
        },    
      },
      {
        tag: 'script',
        content: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', ${config.site.ga_tag});
        `,
      },  
    ],
    sidebar: sidebar.concat(linter_sidebar)
  }),
  tailwind({
    applyBaseStyles: false,
  })]
});
