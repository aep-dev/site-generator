---
title: HTTP URI case
rule:
  aep: 122
  name: [core, '0122', camel-case-uris]
  summary: All resource names must use camel case in collection identifiers.
permalink: /122/camel-case-uris
redirect_from:
  - /0122/camel-case-uris
---

# HTTP URI case

This rule enforces that the HTTP URI pattern only uses kebab-case for word
separation, as mandated in [AEP-122][].

## Details

This rule scans all methods and ensures that the `_` character and no uppercase
letters are present.


## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
rpc GetElectronicBook(GetElectronicBookRequest) returns (ElectronicBook) {
  option (google.api.http) = {
    // Should be "electronicBooks", not "electronnamethic_books".
    get: "/v1/{path=publishers/*/electronicBooks/*}"
  };
}
```

**Correct** code for this rule:

```proto
// Correct.
rpc GetElectronicBook(GetElectronicBookRequest) returns (ElectronicBook) {
  option (google.api.http) = {
    get: "/v1/{path=publishers/*/electronic-books/*}"
  };
}
```

## Disabling

If you need to violate this rule, use a leading comment above the method.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0122::camel-case-uris=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
rpc GetElectronicBook(GetElectronicBookRequest) returns (ElectronicBook) {
  option (google.api.http) = {
    // Should be "electronic-books", not "electronic_books".
    get: "/v1/{path=publishers/*/electronic_books/*}"
  };
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-122]: https://aep.dev/122
[aep.dev/not-precedent]: https://aep.dev/not-precedent
