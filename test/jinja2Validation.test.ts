import { Markdown, buildMarkdown } from "../scripts/src/markdown";

// Simple test function
function runTest(testName: string, testFn: () => void) {
  try {
    testFn();
    console.log(`✅ ${testName} - PASSED`);
  } catch (error) {
    console.error(`❌ ${testName} - FAILED:`, error);
    process.exit(1);
  }
}

// Test 1: Valid Jinja2 tags should not throw errors
runTest("Valid Jinja2 tags should not throw errors", () => {
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
  markdown.validateJinja2Tags();
});

// Test 2: Invalid Jinja2 tag should throw error
runTest("Invalid Jinja2 tag should throw error", () => {
  const invalidContent = `
# Test Document

This has an unsupported tag.

{% for item in items %}
  {{ item }}
{% endfor %}
`;

  const markdown = new Markdown(invalidContent, {});

  try {
    markdown.validateJinja2Tags();
    throw new Error("Expected error was not thrown");
  } catch (error) {
    if (!error.message.includes("Unsupported Jinja2 tag found")) {
      throw new Error(
        `Expected 'Unsupported Jinja2 tag found' error, got: ${error.message}`,
      );
    }
    // Verify the error message lists supported tags
    if (!error.message.includes("{% tab proto %}")) {
      throw new Error("Error message should list supported tags");
    }
  }
});

// Test 3: Multiple invalid tags should report the first one
runTest("Invalid Jinja2 tag with specific tag name in error", () => {
  const invalidContent = `
{% if condition %}
Some content
{% endif %}
`;

  const markdown = new Markdown(invalidContent, {});

  try {
    markdown.validateJinja2Tags();
    throw new Error("Expected error was not thrown");
  } catch (error) {
    if (!error.message.includes("if condition")) {
      throw new Error(
        `Expected error to mention 'if condition', got: ${error.message}`,
      );
    }
  }
});

// Test 4: Tab tags with optional dash should be valid
runTest("Tab tags with optional dash should be valid", () => {
  const contentWithDash = `
{% tab proto -%}
Content
{% tab oas -%}
More content
{% endtabs -%}
`;

  const markdown = new Markdown(contentWithDash, {});
  markdown.validateJinja2Tags(); // Should not throw
});

// Test 5: Sample tags with various arguments should be valid
runTest("Sample tags with various arguments should be valid", () => {
  const sampleContent = `
{% sample 'file.proto', 'arg1', 'arg2' %}
{% sample 'file.yaml', 'arg1' %}
{% sample 'any/path/file.proto', 'token', 'another' %}
`;

  const markdown = new Markdown(sampleContent, {});
  markdown.validateJinja2Tags(); // Should not throw
});

// Test 6: buildMarkdown should validate tags
runTest("buildMarkdown should validate and throw for invalid tags", () => {
  const invalidContent = `
# Test
{% extends "base.html" %}
`;

  try {
    buildMarkdown(invalidContent, "/some/folder");
    throw new Error("Expected error was not thrown");
  } catch (error) {
    if (!error.message.includes("Unsupported Jinja2 tag found")) {
      throw new Error(
        `Expected 'Unsupported Jinja2 tag found' error, got: ${error.message}`,
      );
    }
  }
});

console.log("\n🎉 All Jinja2 validation tests passed!");
