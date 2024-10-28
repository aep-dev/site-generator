import yaml from 'js-yaml';

function sampleCode(code: string, type: string, token1: string, token2: string): string {
    if (type == "protobuf") {
        return sampleProto(code, token1, token2);
    } else if (type == "yml") {
        return sampleYaml(code, token1);
    }
    throw new Error(`Type not found: ${type}`);
}

function sampleYaml(code: string, path: string): string {
    const yaml_code = yaml.load(code);

    // Convert dot notation path into nested object
    let segments = path.split('.');
    let result = {};
    let current = result;

    let traversal = yaml_code;

    for (let i = 0; i < segments.length - 1; i++) {
        if (segments[i] != "$") {
            current[segments[i]] = {};
            current = current[segments[i]];

            if(!(segments[i] in traversal)) {
                throw new Error(`Invalid JSON Path: ${path}`);
            }
            traversal = traversal[segments[i]];
        }
    }
    current[segments[segments.length - 1]] = traversal;

    return yaml.dump(result);
}

function sampleProto(code: string, token1: string, token2: string) {
    let symbols = [];
    if (token1 != "") {
        symbols.push(token1);
    }
    if (token2 != "") {
        symbols.push(token2);
    }

    if (symbols.length != 0) {
        let snippets = [];
        for (let symbol of symbols) {
            const match = code.match(new RegExp(`^([\\s]*)(${symbol})`, "m"));
            if (!match) {
                throw new Error(`Symbol not found: ${symbol}`);
            }

            // Determine the end of the symbol.
            let start = match.index;
            let ix, block_token;
            try {
                [ix, block_token] = [
                    ...[":", "{", ";"].map((token) => [
                        code.indexOf(token, match.index),
                        token,
                    ]),
                ]
                    .filter(([loc]) => loc !== -1)
                    .sort((a, b) => a[0] - b[0])[0];
            } catch (e) {
                throw new Error(
                    `No block character (:, {) found after ${symbol} at line ${code.slice(0, start).split("\n").length - 1}`
                );
            }

            // Push the start marker backwards to include any leading comments.
            let lines = code.slice(0, start).split("\n");
            for (let line of lines.reverse()) {
                if (/^[\s]*(\/\/|#)/.test(line)) {
                    start -= line.length + 1;
                } else {
                    break;
                }
            }

            // Handle block types based on the token found.
            let snippet = "";
            if (block_token === ":") {
                const indent = match[1].length;
                const endMatch = code
                    .slice(ix)
                    .match(new RegExp(`^[\\s]{0,${indent}}[^\\s]`, "m"));
                snippet = endMatch
                    ? code.slice(start, ix + endMatch.index)
                    : code.slice(start);
            } else if (block_token === "{") {
                let cursor = match.index;
                while (true) {
                    const close_brace = code.indexOf("}", cursor);
                    if (close_brace === -1) {
                        throw new Error(
                            `No corresponding } found for ${symbol} at line ${code.slice(0, start).split("\n").length - 1}`
                        );
                    }
                    const s = match.index,
                        e = close_brace + 1;
                    if (
                        code.slice(s, e).split("{").length ===
                        code.slice(s, e).split("}").length
                    ) {
                        snippet = code.slice(start, e);
                        break;
                    }
                    cursor = e;
                }
            } else {
                const end = code.indexOf(";", match.index) + 1;
                snippet = code.slice(start, end);
            }

            // Append the snippet to the list of snippets.
            snippets.push(snippet.trim());
        }

        // We have a snippet. Time to put the Markdown together.
        return snippets.join("\n\n");
    }
    throw new Error("Bad output");
}

export default sampleCode;