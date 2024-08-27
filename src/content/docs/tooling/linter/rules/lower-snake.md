---
title: Field names- Lower Snake Case
rule:
  aep: 140
  name: [core, '0140', lower-snake]
  summary: Field names should use `snake_case`.
permalink: /140/lower-snake
redirect_from:
  - /0140/lower-snake
---

# Field names: Lower Snake Case

This rule enforces that field names use `snake_case`, as mandated in
[AEP-140][].

## Details

This rule checks every field in the proto and complains if the field name
contains a capital letter.

## Examples

### Single word method

**Incorrect** code for this rule:

```proto
// Incorrect.
message Book {
  string name = 1;
  int32 pageCount = 2;  // Should be `page_count`.
}
```

**Correct** code for this rule:

```proto
// Correct.
message Book {
  string name = 1;
  int32 page_count = 2;
}
```

## Disabling

If you need to violate this rule, use a leading comment above the method.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0140::lower-snake=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
message Book {
  string name = 1;
  string pageCount = 2;
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-140]: https://aep.dev/140
[aep.dev/not-precedent]: https://aep.dev/not-precedent
