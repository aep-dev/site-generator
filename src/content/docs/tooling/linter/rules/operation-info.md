---
title: Long-running operation info
rule:
  aep: 151
  name: [core, '0151', operation-info]
  summary: LRO methods must include an `operation_info` annotation.
permalink: /151/operation-info
redirect_from:
  - /0151/operation-info
---

# Long-running operation info

This rule enforces that methods returning long-running operations include an
annotation specifying their response type and metadata type, as mandated in
[AEP-151][].

## Details

This rule looks at any method with a return type of
`google.longrunning.Operation`, and complains if the
`google.longrunning.operation_info` annotation is not present.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
rpc WriteBook(WriteBookRequest) returns (google.longrunning.Operation) {
  option (google.api.http) = {
    post: "/v1/{path=publishers/*/books}:write"
    body: "*"
  };
  // There should be a google.longrunning.operation_info annotation.
}
```

**Correct** code for this rule:

```proto
// Correct.
rpc WriteBook(WriteBookRequest) returns (google.longrunning.Operation) {
  option (google.api.http) = {
    post: "/v1/{path=publishers/*/books}:write"
    body: "*"
  };
  option (google.longrunning.operation_info) = {
    response_type: "WriteBookResponse"
    metadata_type: "WriteBookMetadata"
  };
}
```

## Disabling

If you need to violate this rule, use a leading comment above the method.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0151::operation-info=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
rpc WriteBook(WriteBookRequest) returns (google.longrunning.Operation) {
  option (google.api.http) = {
    post: "/v1/{path=publishers/*/books}:write"
    body: "*"
  };
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-151]: https://aep.dev/151
[aep.dev/not-precedent]: https://aep.dev/not-precedent
