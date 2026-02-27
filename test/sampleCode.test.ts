import * as fs from "fs";
import * as path from "path";
import sampleCode from "../src/components/utils/sample";
import {
  buildLLMsTxt,
  buildPerAEPLLMsTxt,
  cleanContentForLLMs,
  getFirstParagraph,
  extractRules,
} from "../scripts/generate";
import { fileURLToPath } from "url";
import { describe, it, expect } from "@jest/globals";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("sampleCode", () => {
  it("should process YAML type and book path property", () => {
    // Read the test file content
    const testFilePath = path.join(__dirname, "example.oas.yaml");
    const code = fs.readFileSync(testFilePath, "utf-8");

    // Test parameters as specified
    const type = "yml";
    const token1 = "$.components.schemas.book.properties.path";
    const token2 = "";

    // Call the sampleCode function
    const result = sampleCode(code, type, token1, token2);

    // Expected result should be a YAML structure containing the path property
    // from the book schema. The sampleYaml function creates a nested structure
    // where the final segment (path) becomes a key containing the actual value.
    const expectedYaml = `components:
  schemas:
    book:
      properties:
        path:
          type: string
          readOnly: true
`;

    // Assert the result matches expected output
    expect(result.trim()).toBe(expectedYaml.trim());
  });

  it("should throw error for invalid JSON path", () => {
    const code = `components:
  schemas:
    book:
      properties:
        path:
          type: string
`;

    const type = "yml";
    const token1 = "$.components.schemas.book.properties.nonexistent";
    const token2 = "";

    // Should throw an error for invalid path
    expect(() => {
      sampleCode(code, type, token1, token2);
    }).toThrow("Invalid JSON Path");
  });

  it("should throw error for unsupported type", () => {
    const code = "some code";
    const type = "unsupported";
    const token1 = "some.token";
    const token2 = "";

    // Should throw an error for unsupported type
    expect(() => {
      sampleCode(code, type, token1, token2);
    }).toThrow("Type not found");
  });
});

describe("cleanContentForLLMs", () => {
  it("should remove import statements", () => {
    const content =
      'import { Sample } from "../../components/Sample.astro";\n\nSome content.';
    const result = cleanContentForLLMs(content);
    expect(result).not.toContain("import");
    expect(result).toContain("Some content.");
  });

  it("should restore rule identifiers from JSX to markdown bold", () => {
    const content =
      'APIs <b class="font-extrabold text-red-700">must</b> include a name field.';
    const result = cleanContentForLLMs(content);
    expect(result).toContain("**must**");
    expect(result).not.toContain("<b");
  });

  it("should convert AepLink components to markdown links", () => {
    const content =
      'See <AepLink href="/133">Standard Methods</AepLink> for details.';
    const result = cleanContentForLLMs(content);
    expect(result).toContain("[Standard Methods](/133)");
    expect(result).not.toContain("<AepLink");
  });

  it("should remove Sample tags", () => {
    const content =
      'Some text.\n\n<Sample path="/foo" type="proto" token1="bar" token2="" />\n\nMore text.';
    const result = cleanContentForLLMs(content);
    expect(result).not.toContain("<Sample");
    expect(result).toContain("Some text.");
    expect(result).toContain("More text.");
  });

  it("should remove JSX and HTML comments", () => {
    const content = "Before {/* JSX comment */} middle <!-- HTML --> after";
    const result = cleanContentForLLMs(content);
    expect(result).not.toContain("JSX comment");
    expect(result).not.toContain("HTML");
    expect(result).toContain("Before");
    expect(result).toContain("after");
  });

  it("should unescape comparison operators", () => {
    const content = "Values \\<= 10 and \\>= 5.";
    const result = cleanContentForLLMs(content);
    expect(result).toContain("<= 10");
    expect(result).toContain(">= 5");
  });
});

describe("getFirstParagraph", () => {
  it("should return the first non-heading paragraph", () => {
    const content =
      "## Overview\n\nThis is the first paragraph.\n\nThis is the second.";
    const result = getFirstParagraph(content);
    expect(result).toBe("This is the first paragraph.");
  });

  it("should skip headings and separators", () => {
    const content = "---\n\n## Title\n\nActual description here.\n\nMore text.";
    const result = getFirstParagraph(content);
    expect(result).toBe("Actual description here.");
  });

  it("should collapse multiline paragraphs to a single line", () => {
    const content = "First line\ncontinued here.\n\nSecond paragraph.";
    const result = getFirstParagraph(content);
    expect(result).toBe("First line continued here.");
  });

  it("should return empty string for empty content", () => {
    expect(getFirstParagraph("")).toBe("");
    expect(getFirstParagraph("## Just a heading")).toBe("");
  });
});

describe("extractRules", () => {
  it("should extract lines with must/should/may keywords", () => {
    const content =
      "APIs **must** include a name field.\n\nResources **should** use standard methods.\n\nThis is a normal line.";
    const rules = extractRules(content);
    expect(rules).toHaveLength(2);
    expect(rules[0]).toContain("**must**");
    expect(rules[1]).toContain("**should**");
  });

  it("should handle must not, should not, may not", () => {
    const content =
      "APIs **must not** use reserved words.\nFields **should not** be optional.\nClients **may not** cache responses.";
    const rules = extractRules(content);
    expect(rules).toHaveLength(3);
  });

  it("should handle may keyword", () => {
    const content = "Clients **may** include optional headers.";
    const rules = extractRules(content);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toContain("**may**");
  });

  it("should normalize non-bullet lines to bullet points", () => {
    const content = "APIs **must** include a name.";
    const rules = extractRules(content);
    expect(rules[0].startsWith("- ")).toBe(true);
  });

  it("should preserve existing bullet points", () => {
    const content = "- APIs **must** include a name.";
    const rules = extractRules(content);
    expect(rules[0]).toBe("- APIs **must** include a name.");
  });

  it("should deduplicate identical rules", () => {
    const content =
      "APIs **must** include a name.\nAPIs **must** include a name.";
    const rules = extractRules(content);
    expect(rules).toHaveLength(1);
  });

  it("should return empty array when no rules found", () => {
    const content = "This is normal text without any rule keywords.";
    const rules = extractRules(content);
    expect(rules).toHaveLength(0);
  });
});

describe("buildPerAEPLLMsTxt", () => {
  it("should generate full cleaned content with title", () => {
    const mockAep = {
      id: "133",
      title: "Standard Methods: Create",
      contents: {
        contents:
          'import { Sample } from "../../components/Sample.astro";\n\nThis AEP defines create methods.\n\nAPIs <b class="font-extrabold text-red-700">must</b> use POST.',
      },
    };

    const result = buildPerAEPLLMsTxt(mockAep);

    expect(result.startsWith("# AEP-133: Standard Methods: Create")).toBe(true);
    expect(result).toContain("This AEP defines create methods.");
    expect(result).toContain("**must**");
    expect(result).not.toContain("import");
    expect(result).not.toContain("<b class");
  });
});

describe("buildLLMsTxt", () => {
  it("should generate site-wide llms.txt with descriptions and rules", () => {
    const mockAeps = [
      {
        id: "140",
        title: "Field Behavior",
        contents: {
          contents:
            'This AEP defines field behavior patterns.\n\n## Overview\n\nField behavior is important for APIs.\n\nAPIs <b class="font-extrabold text-red-700">must</b> annotate fields.',
        },
      },
      {
        id: "1",
        title: "AEP Purpose and Guidelines",
        contents: {
          contents:
            "This document describes the AEP process.\n\n## What is an AEP?\n\nAn AEP is a design document providing information.",
        },
      },
      {
        id: "133",
        title: "Standard Methods: Create",
        contents: {
          contents:
            'import { Sample } from "../../components/Sample.astro";\n\nThis AEP defines create methods.\n\n<Sample type="proto" /><!-- Comment -->\n\n{/* JSX comment */}\n\nCreate methods <b class="font-extrabold text-red-700">must</b> use POST.\n\nThe response <b class="font-extrabold text-yellow-700">should</b> include the resource.',
        },
      },
    ];

    const result = buildLLMsTxt(mockAeps);

    // Verify header
    expect(result).toContain("# AEP - API Enhancement Proposals");

    // Verify AEPs are sorted by ID in the listing
    const lines = result.split("\n");
    const aep1Index = lines.findIndex((line) =>
      line.includes("AEP-1: AEP Purpose"),
    );
    const aep133Index = lines.findIndex((line) =>
      line.includes("AEP-133: Standard Methods"),
    );
    const aep140Index = lines.findIndex((line) =>
      line.includes("AEP-140: Field Behavior"),
    );

    expect(aep1Index).not.toBe(-1);
    expect(aep133Index).not.toBe(-1);
    expect(aep140Index).not.toBe(-1);
    expect(aep1Index).toBeLessThan(aep133Index);
    expect(aep133Index).toBeLessThan(aep140Index);

    // Verify MDX artifacts are removed
    expect(result).not.toContain("import {");
    expect(result).not.toContain("<Sample");
    expect(result).not.toContain("{/* JSX comment */}");
    expect(result).not.toContain("<!-- Comment -->");

    // Verify descriptions are present (first paragraphs)
    expect(result).toContain("This document describes the AEP process.");
    expect(result).toContain("This AEP defines create methods.");
    expect(result).toContain("This AEP defines field behavior patterns.");

    // Verify links to per-AEP llms.txt
    expect(result).toContain("/1/llms.txt");
    expect(result).toContain("/133/llms.txt");
    expect(result).toContain("/140/llms.txt");

    // Verify rules section exists with extracted rules
    expect(result).toContain("## Rules");
    expect(result).toContain("**must** use POST");
    expect(result).toContain("**should** include the resource");
    expect(result).toContain("**must** annotate fields");

    // Verify AEP-1 has no rules section (no rule keywords)
    const rulesSection = result.substring(result.indexOf("## Rules"));
    expect(rulesSection).not.toContain("### AEP-1:");
  });
});
