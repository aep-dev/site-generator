import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { z } from "zod";

const AEP_LOC = process.env.AEP_LOCATION!;

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

function loadConfigFiles(...fileNames: string[]): Config {
  const config = {};

  fileNames.forEach((fileName) => {
    try {
      const filePath = path.join(AEP_LOC, "config", fileName);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const parsedYaml = yaml.load(fileContents);
      config[fileName.replace('.yaml', '')] = parsedYaml;
    } catch (error) {
      console.error(`Error loading ${fileName}:`, error);
    }
  });

  return Config.parse(config);
}

export default loadConfigFiles;
