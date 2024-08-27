---
title: LRO response type
rule:
  aep: 151
  name: [core, '0151', lro-response-type]
  summary: LRO methods must have a response type.
permalink: /151/lro-response-type
redirect_from:
  - /0151/lro-response-type
---

# LRO response type

This rule enforces that methods returning long-running operations specify a
response type in the `google.longrunning.operation_info` annotation, as
mandated in [AEP-151][].

## Details

This rule looks at any method with a return type of
`google.longrunning.Operation`, and complains if the `response_type` field
`google.longrunning.operation_info` annotation is not present.

Additionally, it complains if the response type is set to
`google.protobuf.Empty`, and recommends making an blank message instead, to
permit future extensibility. However, methods with names beginning with
`Delete` are exempt from this check (see [AEP-135][]).

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
rpc WriteBook(WriteBookRequest) returns (google.longrunning.Operation) {
  option (google.api.http) = {
    post: "/v1/{path=publishers/*/books}:write"
    body: "*"
  };
  option (google.longrunning.operation_info) = {
    // `response_type` is not provided.
    metadata_type: "WriteBookMetadata"
  };
}
```

```proto
// Incorrect.
rpc WriteBook(WriteBookRequest) returns (google.longrunning.Operation) {
  option (google.api.http) = {
    post: "/v1/{path=publishers/*/books}:write"
    body: "*"
  };
  option (google.longrunning.operation_info) = {
    response_type: "google.protobuf.Empty"  // Should not use `Empty`.
    metadata_type: "WriteBookMetadata"
  };
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
// (-- api-linter: core::0151::lro-response-type=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
rpc WriteBook(WriteBookRequest) returns (google.longrunning.Operation) {
  option (google.api.http) = {
    post: "/v1/{path=publishers/*/books}:write"
    body: "*"
  };
  option (google.longrunning.operation_info) = {
    response_type: "google.protobuf.Empty"
    metadata_type: "WriteBookMetadata"
  };
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-135]: https://aep.dev/135
[aep-151]: https://aep.dev/151
[aep.dev/not-precedent]: https://aep.dev/not-precedent
