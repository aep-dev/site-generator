import { visit } from "unist-util-visit";

export function remarkMermaid() {
  return (tree) => {
    visit(tree, "code", (node) => {
      if (node.lang === "mermaid") {
        const encodedContent = encodeURIComponent(node.value);
        node.type = "html";
        node.value = `<mermaid-diagram data-content="${encodedContent}"></mermaid-diagram>`;
      }
    });
  };
}
