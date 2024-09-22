import * as path from 'path';

const ASIDES = {
    'Important': { 'title': 'Important', 'type': 'caution' },
    'Note': { 'title': 'Note', 'type': 'note' },
    'TL;DR': { 'title:': 'TL;DR', 'type': 'tip' },
    'Warning': { 'title': 'Warning', 'type': 'danger' },
    'Summary': { 'type': 'tip', 'title': 'Summary' }
};

const RULE_COLORS = {
    'may': 'font-extrabold text-green-700',
    'may not': 'font-extrabold text-green-700',
    'should': 'font-extrabold	text-yellow-700',
    'should not': 'font-extrabold	text-yellow-700',
    'must': 'font-extrabold	text-red-700',
    'must not': 'font-extrabold	text-red-700'
}

class Markdown {
    contents: string;
    components: Set<string>;

    constructor(contents: string) {
        this.contents = contents;
        this.components = new Set<string>();
    }

    public substituteHTMLComments() {
        this.contents = this.contents.replaceAll("<!-- ", "{/* ")
            .replaceAll("-->", " */}")
        return this;
    }

    public substituteTabs() {
        var tab_regex = /\{% tab proto -?%\}([\s\S]*?)\{% tab oas -?%\}([\s\S]*?)\{% endtabs -?%\}/g
        let tabs = []

        let matches = this.contents.matchAll(tab_regex);
        for (var match of matches) {
            tabs.push({
                'match': match[0],
                'proto': tabContents(match[1]),
                'oas': tabContents(match[2]),
            });
        }
        for (var tab of tabs) {
            var new_tab = `
<Tabs>
  <TabItem label="Protocol Buffers">
${tab['proto']}
  </TabItem>
  <TabItem label="OpenAPI 3.0">
${tab['oas']}
  </TabItem>
</Tabs>
    `
            this.contents = this.contents.replace(tab.match, new_tab);
        }
        return this;
    }
    public substituteSamples(folder: string) {
        var sample_regex = /\{% sample '(.*)', '(.*)', '(.*)' %}/g
        var sample2_regex = /\{% sample '(.*)', '(.*)' %}/g


        let samples = []
        // TODO: Do actual sample parsing.
        const matches = this.contents.matchAll(sample_regex);
        for (var match of matches) {
            if (match[1].endsWith('proto') || match[1].endsWith('yaml')) {
                samples.push({ 'match': match[0], 'filename': match[1], 'token1': match[2], 'token2': match[3] })
            }
        }

        const matches2 = this.contents.matchAll(sample2_regex);
        for (var match of matches2) {
            if (match[1].endsWith('proto') || match[1].endsWith('yaml')) {
                samples.push({ 'match': match[0], 'filename': match[1], 'token1': match[2], 'token2': '' })
            }
        }

        for (var sample of samples) {
            let type = sample.filename.endsWith('proto') ? 'protobuf' : 'yml';
            let formatted_sample = `<Sample path="${path.join(folder, sample.filename)}" type="${type}" token1="${sample.token1}" token2="${sample.token2}" />`
            this.contents = this.contents.replace(sample.match, formatted_sample);
        }
        return this;
    }
    public substituteLinks() {
        // Old site-generator expressed relative links as '[link]: ./0123'.
        // These should be expressed as '[link]: /123'

        this.contents = this.contents.replaceAll(']: ./', ']: /')
        this.contents = this.contents.replaceAll(']: /0', ']: /')
        return this;
    }

    public removeTitle() {
        // Title should be removed because Starlight will add it for us.
        this.contents = this.contents.replace(/# (.*)\n/, '');
        return this;
    }

    public substituteRuleIdentifiers() {
        var rule_regex = /\*\*(should(?: not)?|may(?: not)?|must(?: not)?)\*\*/g
        var matches = this.contents.matchAll(rule_regex);
        for (var match of matches) {
            var color = RULE_COLORS[match[1]];
            this.contents = this.contents.replace(match[0], `<b class="${color}">${match[1]}</b>`);
        }
        return this;
    }

    public substituteCallouts() {
        var paragraph_regex = /(^|\n)\*\*(Note|Warning|Important|Summary|TL;DR):\*\*([\s\S]+?)(?=\n{2,}|$)/g;
        var matches = this.contents.matchAll(paragraph_regex);
        for (var match of matches) {
            const aside_info = ASIDES[match[2]];
            const formatted_results = `
<Aside type="${aside_info.type}" title="${aside_info.title}">
${tabContents(match[3].trimStart())}
</Aside>`
            this.contents = this.contents.replace(match[0], formatted_results);
            this.components.add('Aside');
        }
        return this;
    }

    public substituteEscapeCharacters() {
        this.contents = this.contents.replaceAll('<=', '\\<=')
            .replaceAll('>=', '\\>=');
        return this;
    }

    public substituteGraphviz() {
        this.contents = this.contents.replaceAll('```graphviz', '```dot');
        return this;
    }

}

function buildMarkdown(contents: string, folder: string): Markdown {
    let result = new Markdown(contents);
    return result.substituteSamples(folder)
        .substituteTabs()
        .substituteHTMLComments()
        .substituteEscapeCharacters()
        .substituteCallouts()
        .substituteRuleIdentifiers()
        .removeTitle()
        .substituteLinks()
        .substituteGraphviz();
}

function tabContents(contents: string): string {
    return contents.split('\n').map((x) => '  ' + x).join('\n');
}


export { Markdown, buildMarkdown };