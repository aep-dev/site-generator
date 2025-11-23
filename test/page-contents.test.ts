import { describe, it, expect } from "@jest/globals";
import {
  createEmptySiteStructure as createEmptyContents,
  addOverviewPage,
  addToolingPage,
  addLinterRules,
  addOpenAPILinterRules,
  addAEPEdition,
} from "../src/utils/site-structure";
import {
  assembleSidebarFromSiteStructure as assembleSidebarFromContents,
  readSiteStructure as readContents,
} from "../src/utils/sidebar-from-site-structure";

describe("Page Contents", () => {
  it("should create an empty contents structure", () => {
    const contents = createEmptyContents();
    expect(contents.overview.pages.length).toBe(0);
    expect(Object.keys(contents.aeps.editions).length).toBe(0);
    expect(contents.tooling.pages.length).toBe(0);
  });

  it("should add overview pages", () => {
    let contents = createEmptyContents();
    contents = addOverviewPage(contents, {
      label: "contributing",
      link: "contributing",
    });
    expect(contents.overview.pages.length).toBe(1);
    expect(contents.overview.pages[0].label).toBe("contributing");
  });

  it("should add tooling pages", () => {
    let contents = createEmptyContents();
    contents = addToolingPage(contents, {
      label: "Website",
      link: "tooling/website",
    });
    expect(contents.tooling.pages.length).toBe(1);
    expect(contents.tooling.pages[0].label).toBe("Website");
  });

  it("should add linter rules", () => {
    let contents = createEmptyContents();
    contents = addLinterRules(contents, ["0001", "0002"]);
    expect(contents.tooling.linterRules).toBeDefined();
    expect(contents.tooling.linterRules?.length).toBe(2);
  });

  it("should add OpenAPI linter rules", () => {
    let contents = createEmptyContents();
    contents = addOpenAPILinterRules(contents, ["0001", "0002"]);
    expect(contents.tooling.openAPILinterRules).toBeDefined();
    expect(contents.tooling.openAPILinterRules?.length).toBe(2);
  });

  it("should add AEP edition", () => {
    let contents = createEmptyContents();
    const mockAEPs = [
      {
        id: "1",
        title: "Test AEP",
        slug: "test-aep",
        frontmatter: { state: "approved" },
        category: "design-patterns",
        order: 1,
        contents: null as any,
      },
    ];
    const mockGroups = {
      categories: [{ code: "design-patterns", title: "Design Patterns" }],
    };

    contents = addAEPEdition(contents, "general", mockAEPs, mockGroups);

    expect(contents.aeps.editions["general"]).toBeDefined();
    expect(contents.aeps.editions["general"].categories.length).toBe(1);
    expect(contents.aeps.editions["general"].categories[0].aeps.length).toBe(1);
  });

  it("should assemble sidebar from contents", () => {
    let contents = createEmptyContents();

    // Add some overview pages
    contents = addOverviewPage(contents, {
      label: "contributing",
      link: "contributing",
    });

    // Add some AEPs
    const mockAEPs = [
      {
        id: "1",
        title: "Test AEP",
        slug: "test-aep",
        frontmatter: { state: "approved" },
        category: "design-patterns",
        order: 1,
        contents: null as any,
      },
    ];
    const mockGroups = {
      categories: [{ code: "design-patterns", title: "Design Patterns" }],
    };
    contents = addAEPEdition(contents, "general", mockAEPs, mockGroups);

    // Add some tooling pages
    contents = addToolingPage(contents, {
      label: "Website",
      link: "tooling/website",
    });

    // Assemble sidebar
    const sidebar = assembleSidebarFromContents(contents);

    expect(sidebar.length).toBe(4);

    const overviewSection = sidebar.find((s) => s.label === "Overview");
    expect(overviewSection).toBeDefined();
    expect(overviewSection?.items.length).toBe(1);

    const aepsSection = sidebar.find((s) => s.label === "AEPs");
    expect(aepsSection).toBeDefined();
    expect(aepsSection?.items.length).toBe(1);

    const toolingSection = sidebar.find((s) => s.label === "Tooling");
    expect(toolingSection).toBeDefined();
    expect(toolingSection?.items.length).toBe(1);
  });
});
