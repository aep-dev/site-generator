---
title: Delete methods- Method signature
rule:
  aep: 135
  name: [core, '0135', method-signature]
  summary: |
    Delete RPCs should annotate a method signature of "path".
permalink: /135/method-signature
redirect_from:
  - /0135/method-signature
---

# Delete methods: Method signature

This rule enforces that all `Delete` standard methods have a
`google.api.method_signature` annotation with a value of `"path"`, as mandated
in [AEP-135][].

## Details

This rule looks at any method beginning with `Delete`, and complains if the
`google.api.method_signature` annotation is missing, or if it is set to any
value other than `"path"`. Additional method signatures, if present, are
ignored.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
rpc DeleteBook(DeleteBookRequest) returns (google.protobuf.Empty) {
  // A google.api.method_signature annotation should be present.
}
```

```proto
// Incorrect.
rpc DeleteBook(DeleteBookRequest) returns (google.protobuf.Empty) {
  option (google.api.method_signature) = "book";  // Should be "path".
}
```

**Correct** code for this rule:

```proto
// Correct.
rpc DeleteBook(DeleteBookRequest) returns (google.protobuf.Empty) {
  option (google.api.method_signature) = "path";
}
```

## Disabling

If you need to violate this rule, use a leading comment above the method.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0135::method-signature=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
rpc DeleteBook(DeleteBookRequest) returns (google.protobuf.Empty) {
  option (google.api.method_signature) = "book";
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-135]: https://aep.dev/135
[aep.dev/not-precedent]: https://aep.dev/not-precedent
