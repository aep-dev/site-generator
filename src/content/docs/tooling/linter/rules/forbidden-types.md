---
title: Forbidden types
rule:
  aep: 141
  name: [core, '0141', forbidden-types]
  summary: Fields should avoid unsigned integer types.
permalink: /141/forbidden-types
redirect_from:
  - /0141/forbidden-types
---

# Forbidden types

This rule enforces that fields do not use unsigned integer types (because many
programming languages and systems do not support them well), as mandated in
[AEP-141][].

## Details

This rule scans all fields and complains if it sees any of the following types:

- `fixed32`
- `fixed64`
- `uint32`
- `uint64`

It suggests use of `int32` or `int64` instead.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
message Book {
  string path = 1;
  uint32 page_count = 2;  // Should be `int32`.
}
```

**Correct** code for this rule:

```proto
// Correct.
message Book {
  string path = 1;
  int32 page_count = 2;
}
```

## Disabling

If you need to violate this rule, use a leading comment above the field.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
message Book {
  string path = 1;
  // (-- api-linter: core::0141::forbidden-types=disabled
  //     aep.dev/not-precedent: We need to do this because reasons. --)
  uint32 page_count = 2;
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-141]: https://aep.dev/141
[aep.dev/not-precedent]: https://aep.dev/not-precedent
