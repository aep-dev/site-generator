import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // If we're on a blog page, the starlight-blog middleware has already populated
  // the sidebar with blog-specific content. We need to merge this with our
  // main sidebar structure.
  const isBlogPage = context.url.pathname.startsWith('/blog');

  if (isBlogPage && context.locals.starlightRoute) {
    const blogSidebar = context.locals.starlightRoute.sidebar;

    // The starlight-blog plugin sets the sidebar to blog entries
    // We store them so our Sidebar component can use them
    if (blogSidebar && blogSidebar.length > 0) {
      // Add a flag so Sidebar.astro knows this is blog content
      (context.locals.starlightRoute as any).hasBlogSidebar = true;
    }
  }

  return response;
});
