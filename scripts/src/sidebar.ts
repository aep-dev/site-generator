import { z } from 'zod';

const sidebarItemSchema = z.object({
  label: z.string(),
  items: z.array(z.union([z.string(), z.lazy(() => sidebarItemSchema)]))
});

const sidebarSchema = z.array(sidebarItemSchema);

type Sidebar = z.infer<typeof sidebarSchema>;
