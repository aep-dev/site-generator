import { Markdown } from "../scripts/src/markdown";
import { describe, it, expect } from "@jest/globals";

describe("AEP Link Transformations", () => {
  it("should convert [text][aep-123] to AepLink component", () => {
    const content = `
# Test Document

See the [Create][aep-133] method for more details.
Also check out [List][aep-132] and [Update][aep-134].
`;

    const markdown = new Markdown(content, {});
    markdown.substituteAEPLinks();

    const result = markdown.contents;

    expect(result).toContain('<AepLink href="/133">Create</AepLink>');
    expect(result).toContain('<AepLink href="/132">List</AepLink>');
    expect(result).toContain('<AepLink href="/134">Update</AepLink>');

    // Verify component was added to imports
    expect(
      markdown.components.some(
        (c) =>
          c.names.includes("AepLink") && c.path === "@components/AepLink.astro",
      ),
    ).toBe(true);
  });

  it("should convert standalone AEP references", () => {
    const content = `
# Test Document

This is related to aep-123 and aep-456.
Another reference to AEP-789 (case insensitive).
`;

    const markdown = new Markdown(content, {});
    markdown.substituteStandaloneAEPReferences();

    const result = markdown.contents;

    expect(result).toContain('<AepLink href="/123">aep-123</AepLink>');
    expect(result).toContain('<AepLink href="/456">aep-456</AepLink>');
    expect(result).toContain('<AepLink href="/789">AEP-789</AepLink>');

    // Verify component was added to imports
    expect(
      markdown.components.some(
        (c) =>
          c.names.includes("AepLink") && c.path === "@components/AepLink.astro",
      ),
    ).toBe(true);
  });

  it("should convert plain markdown links to AepLink", () => {
    const content = `
# Test Document

See [Create](/133) for more details.
Also check [List](/132) and [Update](/134).
`;

    const markdown = new Markdown(content, {});
    markdown.substitutePlainAEPLinks();

    const result = markdown.contents;

    expect(result).toContain('<AepLink href="/133">Create</AepLink>');
    expect(result).toContain('<AepLink href="/132">List</AepLink>');
    expect(result).toContain('<AepLink href="/134">Update</AepLink>');

    // Verify component was added to imports
    expect(
      markdown.components.some(
        (c) =>
          c.names.includes("AepLink") && c.path === "@components/AepLink.astro",
      ),
    ).toBe(true);
  });

  it("should not convert links to non-AEP pages", () => {
    const content = `
# Test Document

See [documentation](/docs/getting-started) for more.
Also visit [our blog](/blog/2024/hello-world).
`;

    const markdown = new Markdown(content, {});
    markdown.substitutePlainAEPLinks();

    const result = markdown.contents;

    // These should remain as plain markdown
    expect(result).not.toContain("AepLink");
    expect(result).toContain("[documentation](/docs/getting-started)");
  });

  it("should only import AepLink component once", () => {
    const content = `
# Test Document

See [Create][aep-133] and aep-134 and [Delete](/135).
`;

    const markdown = new Markdown(content, {});
    markdown
      .substituteAEPLinks()
      .substituteStandaloneAEPReferences()
      .substitutePlainAEPLinks();

    // Count how many times AepLink appears in components
    const aepLinkComponents = markdown.components.filter(
      (c) =>
        c.names.includes("AepLink") && c.path === "@components/AepLink.astro",
    );

    expect(aepLinkComponents.length).toBe(1);

    // Verify all three AepLinks are in the content
    expect(markdown.contents).toContain(
      '<AepLink href="/133">Create</AepLink>',
    );
    expect(markdown.contents).toContain(
      '<AepLink href="/134">aep-134</AepLink>',
    );
    expect(markdown.contents).toContain(
      '<AepLink href="/135">Delete</AepLink>',
    );
  });

  it("should handle edge cases with AEP numbers", () => {
    const content = `
# Test Document

See [Short](/1) and [Long](/1234).
Also aep-9999 and [Reference][aep-007].
`;

    const markdown = new Markdown(content, {});
    markdown
      .substituteAEPLinks()
      .substituteStandaloneAEPReferences()
      .substitutePlainAEPLinks();

    const result = markdown.contents;

    expect(result).toContain('<AepLink href="/1">Short</AepLink>');
    expect(result).toContain('<AepLink href="/1234">Long</AepLink>');
    expect(result).toContain('<AepLink href="/9999">aep-9999</AepLink>');
    expect(result).toContain('<AepLink href="/007">Reference</AepLink>');
  });
});
