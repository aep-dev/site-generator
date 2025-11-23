import * as fs from "fs";
import * as path from "path";
import sampleCode from "../src/components/utils/sample";
import { buildLLMsTxt } from "../scripts/generate";
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

describe("buildLLMsTxt", () => {
  it("should generate correct llms.txt format", () => {
    // Mock AEP data
    const mockAeps = [
      {
        id: "140",
        title: "Field Behavior",
        contents: {
          contents:
            "This AEP defines field behavior patterns.\n\n## Overview\n\nField behavior is important for APIs.",
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
            'import { Sample } from "../../components/Sample.astro";\n\nThis AEP defines create methods.\n\n<Sample type="proto" /><!-- Comment -->\n\n{/* JSX comment */}',
        },
      },
    ];

    const result = buildLLMsTxt(mockAeps);

    // Verify AEPs are sorted by ID
    const lines = result.split("\n");
    const aep1Index = lines.findIndex((line) =>
      line.includes("AEP-1 AEP Purpose"),
    );
    const aep133Index = lines.findIndex((line) =>
      line.includes("AEP-133 Standard Methods"),
    );
    const aep140Index = lines.findIndex((line) =>
      line.includes("AEP-140 Field Behavior"),
    );

    expect(aep1Index).not.toBe(-1);
    expect(aep133Index).not.toBe(-1);
    expect(aep140Index).not.toBe(-1);
    expect(aep1Index).toBeLessThan(aep133Index);
    expect(aep133Index).toBeLessThan(aep140Index);

    // Verify section separators
    expect(result).toContain("\n---\n");

    // Verify MDX artifacts are removed
    expect(result).not.toContain("import {");
    expect(result).not.toContain("<Sample");
    expect(result).not.toContain("{/* JSX comment */}");

    // Verify HTML comments are removed
    expect(result).not.toContain("<!-- Comment -->");

    // Verify proper heading format
    expect(result).toContain("# AEP-1 AEP Purpose and Guidelines");
    expect(result).toContain("# AEP-133 Standard Methods: Create");
    expect(result).toContain("# AEP-140 Field Behavior");

    // Verify content is present
    expect(result).toContain("This document describes the AEP process");
    expect(result).toContain("Field behavior is important for APIs");
    expect(result).toContain("This AEP defines create methods");
  });
});
