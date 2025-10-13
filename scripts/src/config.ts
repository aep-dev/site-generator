import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import type { Config } from "./types";

const AEP_LOC = process.env.AEP_LOCATION!;

function loadConfigFiles(...fileNames: string[]): Config {
  const config = {};

  fileNames.forEach((fileName) => {
    try {
      const filePath = path.join(AEP_LOC, "config", fileName);
      const fileContents = fs.readFileSync(filePath, "utf8");
      const parsedYaml = yaml.load(fileContents);
      config[fileName.replace(".yaml", "")] = parsedYaml;
    } catch (error) {
      console.error(`Error loading ${fileName}:`, error);
    }
  });

  return config as Config;
}

export default loadConfigFiles;
