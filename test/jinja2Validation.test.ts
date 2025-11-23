import { Markdown, buildMarkdown } from "../scripts/src/markdown";
import { describe, it, expect } from "@jest/globals";

describe("Jinja2 Validation", () => {
  it("should not throw errors for valid Jinja2 tags", () => {
    const validContent = `
# Test Document

This is a test with valid Jinja2 tags.

{% tab proto %}
Some proto content
{% tab oas %}
Some OAS content
{% endtabs %}

{% sample 'example.proto', 'token1', 'token2' %}

{% sample 'example.yaml', 'token1' %}
`;

    // Should not throw
    const markdown = new Markdown(validContent, {});
    expect(() => markdown.validateJinja2Tags()).not.toThrow();
  });

  it("should throw error for invalid Jinja2 tag", () => {
    const invalidContent = `
# Test Document

This has an unsupported tag.

{% for item in items %}
  {{ item }}
{% endfor %}
`;

    const markdown = new Markdown(invalidContent, {});

    expect(() => markdown.validateJinja2Tags()).toThrow(
      "Unsupported Jinja2 tag found",
    );

    // Verify the error message lists supported tags
    try {
      markdown.validateJinja2Tags();
    } catch (error: any) {
      expect(error.message).toContain("{% tab proto %}");
    }
  });

  it("should report the first invalid tag with specific tag name in error", () => {
    const invalidContent = `
{% if condition %}
Some content
{% endif %}
`;

    const markdown = new Markdown(invalidContent, {});

    expect(() => markdown.validateJinja2Tags()).toThrow();

    try {
      markdown.validateJinja2Tags();
    } catch (error: any) {
      expect(error.message).toContain("if condition");
    }
  });

  it("should accept tab tags with optional dash", () => {
    const contentWithDash = `
{% tab proto -%}
Content
{% tab oas -%}
More content
{% endtabs -%}
`;

    const markdown = new Markdown(contentWithDash, {});
    expect(() => markdown.validateJinja2Tags()).not.toThrow();
  });

  it("should accept sample tags with various arguments", () => {
    const sampleContent = `
{% sample 'file.proto', 'arg1', 'arg2' %}
{% sample 'file.yaml', 'arg1' %}
{% sample 'any/path/file.proto', 'token', 'another' %}
`;

    const markdown = new Markdown(sampleContent, {});
    expect(() => markdown.validateJinja2Tags()).not.toThrow();
  });

  it("should validate tags in buildMarkdown and throw for invalid tags", () => {
    const invalidContent = `
# Test
{% extends "base.html" %}
`;

    expect(() => buildMarkdown(invalidContent, "/some/folder")).toThrow(
      "Unsupported Jinja2 tag found",
    );
  });
});
