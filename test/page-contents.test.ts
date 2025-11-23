import { describe, it } from "../test/lib/index";
import {
  createEmptyContents,
  addOverviewPage,
  addToolingPage,
  addLinterRules,
  addOpenAPILinterRules,
  addAEPEdition,
} from "../scripts/src/page-contents";
import {
  assembleSidebarFromContents,
  readContents,
} from "../scripts/src/sidebar-from-contents";

describe("Page Contents", () => {
  it("should create an empty contents structure", () => {
    const contents = createEmptyContents();
    if (contents.overview.pages.length !== 0) {
      throw new Error("Expected overview pages to be empty");
    }
    if (Object.keys(contents.aeps.editions).length !== 0) {
      throw new Error("Expected AEPs editions to be empty");
    }
    if (contents.tooling.pages.length !== 0) {
      throw new Error("Expected tooling pages to be empty");
    }
  });

  it("should add overview pages", () => {
    let contents = createEmptyContents();
    contents = addOverviewPage(contents, {
      label: "contributing",
      link: "contributing",
    });
    if (contents.overview.pages.length !== 1) {
      throw new Error("Expected 1 overview page");
    }
    if (contents.overview.pages[0].label !== "contributing") {
      throw new Error("Expected page label to be 'contributing'");
    }
  });

  it("should add tooling pages", () => {
    let contents = createEmptyContents();
    contents = addToolingPage(contents, {
      label: "Website",
      link: "tooling/website",
    });
    if (contents.tooling.pages.length !== 1) {
      throw new Error("Expected 1 tooling page");
    }
    if (contents.tooling.pages[0].label !== "Website") {
      throw new Error("Expected page label to be 'Website'");
    }
  });

  it("should add linter rules", () => {
    let contents = createEmptyContents();
    contents = addLinterRules(contents, ["0001", "0002"]);
    if (!contents.tooling.linterRules) {
      throw new Error("Expected linter rules to be set");
    }
    if (contents.tooling.linterRules.length !== 2) {
      throw new Error("Expected 2 linter rules");
    }
  });

  it("should add OpenAPI linter rules", () => {
    let contents = createEmptyContents();
    contents = addOpenAPILinterRules(contents, ["0001", "0002"]);
    if (!contents.tooling.openAPILinterRules) {
      throw new Error("Expected OpenAPI linter rules to be set");
    }
    if (contents.tooling.openAPILinterRules.length !== 2) {
      throw new Error("Expected 2 OpenAPI linter rules");
    }
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

    if (!contents.aeps.editions["general"]) {
      throw new Error("Expected general edition to be set");
    }
    if (contents.aeps.editions["general"].categories.length !== 1) {
      throw new Error("Expected 1 category");
    }
    if (contents.aeps.editions["general"].categories[0].aeps.length !== 1) {
      throw new Error("Expected 1 AEP in category");
    }
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

    if (sidebar.length !== 4) {
      throw new Error("Expected 4 sidebar sections");
    }

    const overviewSection = sidebar.find((s) => s.label === "Overview");
    if (!overviewSection) {
      throw new Error("Expected Overview section");
    }
    if (overviewSection.items.length !== 1) {
      throw new Error("Expected 1 item in Overview section");
    }

    const aepsSection = sidebar.find((s) => s.label === "AEPs");
    if (!aepsSection) {
      throw new Error("Expected AEPs section");
    }
    if (aepsSection.items.length !== 1) {
      throw new Error("Expected 1 category in AEPs section");
    }

    const toolingSection = sidebar.find((s) => s.label === "Tooling");
    if (!toolingSection) {
      throw new Error("Expected Tooling section");
    }
    if (toolingSection.items.length !== 1) {
      throw new Error("Expected 1 item in Tooling section");
    }
  });
});
