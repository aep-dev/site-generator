import { visit } from "unist-util-visit";

function remarkMermaid() {
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

export default function astroMermaid() {
  return {
    name: "astro-mermaid",
    hooks: {
      "astro:config:setup"({ updateConfig, injectScript }) {
        updateConfig({
          markdown: { remarkPlugins: [remarkMermaid] },
        });

        injectScript(
          "page",
          `
import mermaid from "mermaid";

const getMermaidTheme = () => {
  const theme = document.documentElement.dataset.theme;
  if (theme === "light") return "default";
  if (theme === "dark") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "default";
};

mermaid.initialize({ startOnLoad: false, theme: getMermaidTheme() });

class MermaidDiagram extends HTMLElement {
  async renderDiagram() {
    const content = decodeURIComponent(this.dataset.content || "");
    if (!content) return;

    try {
      const id = \`mermaid-\${crypto.randomUUID()}\`;
      const { svg } = await mermaid.render(id, content);
      this.innerHTML = svg;
    } catch (error) {
      console.error("Failed to render Mermaid diagram:", error);
      this.innerHTML = \`<pre><code>\${content}</code></pre>\`;
    }
  }

  connectedCallback() {
    this.renderDiagram();
  }
}

customElements.define("mermaid-diagram", MermaidDiagram);

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.attributeName === "data-theme") {
      mermaid.initialize({ theme: getMermaidTheme() });
      document.querySelectorAll("mermaid-diagram").forEach((el) => {
        el.renderDiagram();
      });
    }
  }
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});
`,
        );
      },
    },
  };
}
