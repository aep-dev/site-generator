---
title: HTTP URI case
rule:
  aep: 127
  name: [core, '0127', resource-path-extraction]
  summary: HTTP annotations should extract full resource paths into variables.
permalink: /127/resource-path-extraction
redirect_from:
  - /0127/resource-path-extraction
---

# HTTP URI case

This rule enforces that HTTP annotations pull whole resource paths into
variables, and not just the ID components, as mandated in [AEP-127][].

## Details

This rule scans all methods and complains if it finds a URI with a variable
whose value is `*`.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
rpc GetBook(GetBookRequest) returns (Book) {
  // Should be /v1/{path=publishers/*/books/*}
  get: "/v1/publishers/{publisher_id}/books/{book_id}"
}
```

```proto
// Incorrect.
rpc GetBook(GetBookRequest) returns (Book) {
  // Should be /v1/{path=publishers/*/books/*}
  get: "/v1/publishers/{publisher_id=*}/books/{book_id=*}"
}
```

**Correct** code for this rule:

```proto
// Correct.
rpc GetBook(GetBookRequest) returns (Book) {
  option (google.api.http) = {
    get: "/v1/{path=publishers/*/books/*}"
  };
}
```

## Disabling

If you need to violate this rule, use a leading comment above the method.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0127::resource-path-extraction=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
rpc GetBook(GetBookRequest) returns (Book) {
  get: "/v1/publishers/{publisher_id}/books/{book_id}"
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-127]: https://aep.dev/127
[aep.dev/not-precedent]: https://aep.dev/not-precedent
