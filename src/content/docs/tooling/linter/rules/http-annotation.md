---
title: HTTP URI case
rule:
  aep: 127
  name: [core, '0127', http-annotation]
  summary: HTTP annotations must be present on non-streaming methods.
permalink: /127/http-annotation
redirect_from:
  - /0127/http-annotation
---

# HTTP URI case

This rule enforces that the HTTP annotation is present on all
non-bidi-streaming methods and absent on streaming methods, as mandated in
[AEP-127](http://aep.dev/127).

## Details

This rule scans all methods that a `google.api.http` annotation is present on
all non-streaming methods, as well as methods that only use streaming in one
direction. It complains if an annotation is not found.

For bidi-streaming methods, it complains if a `google.api.http` annotation _is_
found.

## Examples

### Unary methods

**Incorrect** code for this rule:

```proto
// Incorrect.
rpc GetBook(GetBookRequest) returns (Book);  // Missing `google.api.http`.
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

### Bidi-streaming methods

**Incorrect** code for this rule:

```proto
// Incorrect.
rpc EditBook(stream EditBookRequest) returns (stream EditBookResponse) {
  option (google.api.http) = {  // HTTP/1.1 not supported for bi-di streaming.
    post: "/v1/{path=publishers/*/books/*}:edit"
    body: "*"
  };
}
```

**Correct** code for this rule:

```proto
// Correct.
rpc EditBook(stream EditBookRequest) returns (stream EditBookResponse);
```

## Disabling

If you need to violate this rule, use a leading comment above the method.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0127::http-annotation=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
rpc GetBook(GetBookRequest) returns (Book);
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-127]: https://aep.dev/127
[aep.dev/not-precedent]: https://aep.dev/not-precedent
