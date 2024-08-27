---
title: Path field suffix
rule:
  aep: 122
  path: [core, '0122', path-suffix]
  summary: Fields should not use the suffix `_path`.
permalink: /122/path-suffix
redirect_from:
  - /0122/path-suffix
---

# Path field suffix

This rule enforces that fields do not use the suffix `_path`, as mandated in
[AEP-122][].

## Details

This rule scans all fields complains if it sees the suffix `_path` on a field.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
message Book {
  string path = 1;
  string author_path = 2;  // Should be `author`.
}
```

**Correct** code for this rule:

```proto
// Correct.
message Book {
  string path = 1;
  string author = 2;
}
```

## Disabling

If you need to violate this rule, use a leading comment above the method.

```proto
// (-- api-linter: core::0122::path-suffix=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
message Book {
  string path = 1;
  string author_path = 2;  // Should be `author`.
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-122]: http://aep.dev/122
[aep.dev/not-precedent]: https://aep.dev/not-precedent
