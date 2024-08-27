---
title: List methods- Unknown fields
rule:
  aep: 132
  name: [core, '0132', request-field-types]
  summary: List RPCs should have fields with consistent types.
permalink: /132/request-field-types
redirect_from:
  - /0132/request-field-types
---

# List methods: Unknown fields

This rule enforces that all `List` standard methods use the correct type for
any optional fields described in [AEP-132][].

## Details

This rule looks at the fields in any message matching `List*Request` and
complains if finds fields with the names below that do not have the correct
type:

- `string filter`
- `string order_by`
- `bool show_deleted`

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
message ListBooksRequest {
  string parent = 1;
  int32 page_size = 2;
  string page_token = 3;
  BookFilter filter = 4;  // Wrong type; should be a string.
}
```

**Correct** code for this rule:

```proto
// Correct.
message ListBooksRequest {
  string parent = 1;
  int32 page_size = 2;
  string page_token = 3;
  string filter = 4;
}
```

## Disabling

If you need to violate this rule, use a leading comment above the field.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
message ListBooksRequest {
  string parent = 1;
  int32 page_size = 2;
  string page_token = 3;

  // (-- api-linter: core::0132::request-field-types=disabled
  //     aep.dev/not-precedent: We really need this field because reasons. --)
  BookFilter filter = 4;
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-132]: https://aep.dev/132
[aep.dev/not-precedent]: https://aep.dev/not-precedent
