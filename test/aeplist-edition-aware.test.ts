import { describe, it, expect } from "@jest/globals";
import {
  createEmptySiteStructure,
  addAEPEdition,
  type SiteStructure,
} from "../src/utils/site-structure";

describe("Edition-Aware AepList", () => {
  it("should create site structure with multiple editions", () => {
    let siteStructure = createEmptySiteStructure();

    // Mock AEPs for general edition
    const generalAEPs = [
      {
        id: "1",
        title: "General AEP 1",
        slug: "general-aep-1",
        frontmatter: { state: "approved" },
        category: "design-patterns",
        order: 1,
        contents: null as any,
      },
      {
        id: "2",
        title: "General AEP 2",
        slug: "general-aep-2",
        frontmatter: { state: "reviewing" },
        category: "resource-design",
        order: 2,
        contents: null as any,
      },
    ];

    // Mock AEPs for 2026 edition
    const aep2026AEPs = [
      {
        id: "1",
        title: "2026 AEP 1",
        slug: "2026-aep-1",
        frontmatter: { state: "approved" },
        category: "design-patterns",
        order: 1,
        contents: null as any,
      },
    ];

    const mockGroups = {
      categories: [
        { code: "design-patterns", title: "Design Patterns" },
        { code: "resource-design", title: "Resource Design" },
      ],
    };

    // Add general edition
    siteStructure = addAEPEdition(
      siteStructure,
      "general",
      generalAEPs,
      mockGroups,
      ".",
    );

    // Add 2026 edition
    siteStructure = addAEPEdition(
      siteStructure,
      "aep-2026",
      aep2026AEPs,
      mockGroups,
      "aep-2026",
    );

    // Verify both editions exist
    expect(siteStructure.aeps.editions["general"]).toBeDefined();
    expect(siteStructure.aeps.editions["aep-2026"]).toBeDefined();

    // Verify general edition has correct data
    const generalEdition = siteStructure.aeps.editions["general"];
    expect(generalEdition.name).toBe("general");
    expect(generalEdition.folder).toBe(".");
    expect(generalEdition.categories.length).toBe(2);

    const designPatternsCategory = generalEdition.categories.find(
      (c) => c.code === "design-patterns",
    );
    expect(designPatternsCategory).toBeDefined();
    expect(designPatternsCategory?.aeps.length).toBe(1);
    expect(designPatternsCategory?.aeps[0].title).toBe("General AEP 1");

    // Verify 2026 edition has correct data
    const aep2026Edition = siteStructure.aeps.editions["aep-2026"];
    expect(aep2026Edition.name).toBe("aep-2026");
    expect(aep2026Edition.folder).toBe("aep-2026");
    expect(aep2026Edition.categories.length).toBe(1);
    expect(aep2026Edition.categories[0].aeps.length).toBe(1);
    expect(aep2026Edition.categories[0].aeps[0].title).toBe("2026 AEP 1");
  });

  it("should properly categorize AEPs in each edition", () => {
    let siteStructure = createEmptySiteStructure();

    const aeps = [
      {
        id: "1",
        title: "Design Pattern AEP",
        slug: "design-pattern",
        frontmatter: { state: "approved" },
        category: "design-patterns",
        order: 1,
        contents: null as any,
      },
      {
        id: "2",
        title: "Resource Design AEP",
        slug: "resource-design",
        frontmatter: { state: "approved" },
        category: "resource-design",
        order: 2,
        contents: null as any,
      },
      {
        id: "3",
        title: "Another Design Pattern",
        slug: "another-pattern",
        frontmatter: { state: "reviewing" },
        category: "design-patterns",
        order: 3,
        contents: null as any,
      },
    ];

    const mockGroups = {
      categories: [
        { code: "design-patterns", title: "Design Patterns" },
        { code: "resource-design", title: "Resource Design" },
      ],
    };

    siteStructure = addAEPEdition(
      siteStructure,
      "test-edition",
      aeps,
      mockGroups,
      "test",
    );

    const edition = siteStructure.aeps.editions["test-edition"];

    // Should have 2 categories (design-patterns and resource-design)
    expect(edition.categories.length).toBe(2);

    // Design patterns should have 2 AEPs
    const designPatterns = edition.categories.find(
      (c) => c.code === "design-patterns",
    );
    expect(designPatterns?.aeps.length).toBe(2);
    expect(designPatterns?.aeps[0].id).toBe("1");
    expect(designPatterns?.aeps[1].id).toBe("3");

    // Resource design should have 1 AEP
    const resourceDesign = edition.categories.find(
      (c) => c.code === "resource-design",
    );
    expect(resourceDesign?.aeps.length).toBe(1);
    expect(resourceDesign?.aeps[0].id).toBe("2");
  });

  it("should include status information for AEPs", () => {
    let siteStructure = createEmptySiteStructure();

    const aeps = [
      {
        id: "1",
        title: "Approved AEP",
        slug: "approved",
        frontmatter: { state: "approved" },
        category: "design-patterns",
        order: 1,
        contents: null as any,
      },
      {
        id: "2",
        title: "Reviewing AEP",
        slug: "reviewing",
        frontmatter: { state: "reviewing" },
        category: "design-patterns",
        order: 2,
        contents: null as any,
      },
    ];

    const mockGroups = {
      categories: [{ code: "design-patterns", title: "Design Patterns" }],
    };

    siteStructure = addAEPEdition(
      siteStructure,
      "test-edition",
      aeps,
      mockGroups,
    );

    const edition = siteStructure.aeps.editions["test-edition"];
    const category = edition.categories[0];

    expect(category.aeps[0].status).toBe("approved");
    expect(category.aeps[1].status).toBe("reviewing");
  });

  it("should transform edition data correctly for FullAepList component", () => {
    let siteStructure = createEmptySiteStructure();

    const aeps = [
      {
        id: "1",
        title: "Test AEP",
        slug: "test",
        frontmatter: { state: "approved" },
        category: "design-patterns",
        order: 1,
        contents: null as any,
      },
    ];

    const mockGroups = {
      categories: [{ code: "design-patterns", title: "Design Patterns" }],
    };

    siteStructure = addAEPEdition(
      siteStructure,
      "test-edition",
      aeps,
      mockGroups,
    );

    const edition = siteStructure.aeps.editions["test-edition"];

    // This simulates what FullAepList does
    const sideBar = edition.categories.map((category) => ({
      label: category.title,
      items: category.aeps,
    }));

    expect(sideBar.length).toBe(1);
    expect(sideBar[0].label).toBe("Design Patterns");
    expect(sideBar[0].items.length).toBe(1);
    expect(sideBar[0].items[0].id).toBe("1");
    expect(sideBar[0].items[0].title).toBe("Test AEP");
    expect(sideBar[0].items[0].slug).toBe("test");
    expect(sideBar[0].items[0].status).toBe("approved");
  });
});
