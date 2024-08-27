---
title: Field names- Prepositions
rule:
  aep: 140
  name: [core, '0140', prepositions]
  summary: Fields must not include prepositions in their names.
permalink: /140/prepositions
redirect_from:
  - /0140/prepositions
---

# Field names: Prepositions

This rule enforces that field names do not include most prepositions, as
mandated in [AEP-140][].

## Details

This rule looks at each field and complains if it sees any of the following
words in the method's name:

{% include prepositions.md %}

**Note:** The standard fields `order_by` and `group_by` are permitted.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
message Book {
  string name = 1;
  string written_by = 2;  // Should be `author`.
}
```

**Correct** code for this rule:

```proto
// Correct.
message Book {
  string name = 1;
  string author = 2;
}
```

## Disabling

If you need to violate this rule, use a leading comment above the field.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0140::prepositions=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
message Book {
  string name = 1;
  string written_by = 2;
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-140]: https://aep.dev/140
[aep.dev/not-precedent]: https://aep.dev/not-precedent
