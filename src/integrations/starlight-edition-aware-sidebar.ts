import type { AstroIntegration } from "astro";
import { fileURLToPath } from "node:url";

/**
 * Starlight plugin that provides edition-aware sidebar support via middleware
 */
export function starlightEditionAwareSidebar(): AstroIntegration {
  return {
    name: "starlight-edition-aware-sidebar",
    hooks: {
      "astro:config:setup": ({ addMiddleware }) => {
        // Inject middleware to detect edition from URL path
        addMiddleware({
          entrypoint: fileURLToPath(
            new URL("./edition-middleware.ts", import.meta.url),
          ),
          order: "pre",
        });
      },
    },
  };
}
