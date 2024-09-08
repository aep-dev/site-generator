---
title: Absolute links
rule:
  aep: 192
  name: [core, '0192', absolute-links]
  summary: Comments must use absolute links
permalink: /192/absolute-links
redirect_from:
  - /0192/absolute-links
---

# Absolute links

This rule attempts to enforce that every descriptor in every proto file uses
absolute links, as mandated in [AEP-192][].

## Details

This rule looks at each descriptor in each proto file (exempting oneofs and the
file itself) and tries to find Markdown links using the `[link](uri)` syntax,
and complains if the URI does not have `://` in it.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
// A representation of [a book](/wiki/Book).
message Book {
  string name = 1;
}
```

**Correct** code for this rule:

```proto
// Correct.
// A representation of [a book](https://en.wikipedia.org/wiki/Book).
message Book {
  string name = 1;
}
```

## Disabling

If you need to violate this rule, use a leading comment above the descriptor
(and revel in the irony). Remember to also include an [aep.dev/not-precedent][]
comment explaining why.

```proto
// (-- api-linter: core::0192::absolute-links=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
// A representation of [a book](/wiki/Book).
message Book {
  string name = 1;
}
```

[aep-192]: https://aep.dev/192
[aep.dev/not-precedent]: https://aep.dev/not-precedent
