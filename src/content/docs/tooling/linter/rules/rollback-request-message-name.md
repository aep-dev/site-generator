---
title: Rollback methods- Request message
rule:
  aep: 162
  name: [core, '0162', rollback-request-message-name]
  summary: Rollback methods must have standardized request message names.
permalink: /162/rollback-request-message-name
redirect_from:
  - /0162/rollback-request-message-name
---

# Rollback methods: Request message

This rule enforces that all `Rollback` RPCs have a request message name of
`Rollback*Request`, as mandated in [AEP-162][].

## Details

This rule looks at any method beginning with `Rollback`, and complains
if the name of the corresponding input message does not match the name of the
RPC with the suffix `Request` appended.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
// Should be `RollbackBookRequest`.
rpc RollbackBook(UndoBookRequest) returns (Book) {
  option (google.api.http) = {
    post: "/v1/{name=publishers/*/books/*}:rollback"
    body: "*"
  };
}
```

**Correct** code for this rule:

```proto
// Correct.
rpc RollbackBook(RollbackBookRequest) returns (Book) {
  option (google.api.http) = {
    post: "/v1/{name=publishers/*/books/*}:rollback"
    body: "*"
  };
}
```

## Disabling

If you need to violate this rule, use a leading comment above the method.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0162::rollback-request-message-name=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
rpc RollbackBook(UndoBookRequest) returns (Book) {
  option (google.api.http) = {
    post: "/v1/{name=publishers/*/books/*}:rollback"
    body: "*"
  };
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-162]: https://aep.dev/162
[aep.dev/not-precedent]: https://aep.dev/not-precedent
