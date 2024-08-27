---
title: File layout
rule:
  aep: 191
  name: [core, '0191', file-layout]
  summary: Proto files should follow a consistent layout.
permalink: /191/file-layout
redirect_from:
  - /0191/file-layout
---

# File layout

This rule attempts to enforce a consistent file layout for proto files, as
mandated in [AEP-191][].

## Details

This rule checks for common file layout mistakes, but does not currently check
the exhaustive file layout in AEP-191. This rule currently complains if within a
file:

- ...services appear below messages.
- ...top-level enums appear above messages.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
// Services should appear before messages.
message Book {
  string path = 1;
}

service Library {
  rpc GetBook(GetBookRequest) returns (Book) {
    option (google.api.http) = {
      get: "/v1/{path=publishers/*/books/*}"
    };
  }
}

message GetBookRequest {
  string path = 1;
}
```

**Correct** code for this rule:

```proto
// Correct.
service Library {
  rpc GetBook(GetBookRequest) returns (Book) {
    option (google.api.http) = {
      get: "/v1/{path=publishers/*/books/*}"
    };
  }
}

message Book {
  string path = 1;
}

message GetBookRequest {
  string path = 1;
}
```

## Disabling

If you need to violate this rule, use a comment at the top of the file.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0191::file-layout=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
syntax = "proto3";

import "google/api/anotations.proto";

message Book {
  string path = 1;
}

service Library {
  rpc GetBook(GetBookRequest) returns (Book) {
    option (google.api.http) = {
      get: "/v1/{path=publishers/*/books/*}"
    };
  }
}

message GetBookRequest {
  string path = 1;
}
```

[aep-191]: https://aep.dev/191
[aep.dev/not-precedent]: https://aep.dev/not-precedent
