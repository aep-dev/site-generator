import { z } from "zod";
import type { Markdown } from "./markdown";

const Config = z.object({
  hero: z.object({
    buttons: z.array(z.object({
        text: z.string(),
        href: z.string(),
    })),
    shortcuts: z.array(z.object({
        title: z.string(),
        description: z.string(),
        button: z.object({
            text: z.string(),
            href: z.string(),
        }),
    })),
  }),
  site: z.object({
    ga_tag: z.string(),
  }),
  urls: z.object({
    site: z.string(),
    repo: z.string(),
  }),
});

type Config = z.infer<typeof Config>;

const SideBarItem = z.object({
  label: z.string(),
  collapsed: z.boolean().optional(),
  items: z.array(z.union([z.string(), z.lazy(() => SideBarItem)]))
});

const Sidebar = z.array(SideBarItem);

type Sidebar = z.infer<typeof Sidebar>;

interface AEP {
  title: string;
  id: string;
  frontmatter: object;
  contents: Markdown;
  category: string;
  order: number;
  slug: string;
}

interface LinterRule {
  title: string;
  aep: string;
  contents: Markdown;
  filename: string;
  slug: string;
}

interface ConsolidatedLinterRule {
  aep: string;
  contents: string;
}

interface GroupFile {
  categories: Group[]
}

interface Group {
  code: string;
  title: string;
}

export type { AEP, LinterRule, ConsolidatedLinterRule, Markdown, GroupFile, Group, Config, Sidebar };