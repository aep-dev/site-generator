---
title: Delete methods- path field
rule:
  aep: 135
  name: [core, '0135', request-path-field]
  summary: Delete RPCs must have a `path` field in the request.
permalink: /135/request-path-field
redirect_from:
  - /0135/request-path-field
---

# Delete methods: path field

This rule enforces that all `Delete` standard methods have a `string path`
field in the request message, as mandated in [AEP-135][].

## Details

This rule looks at any message matching `Delete*Request` and complains if
either the `path` field is missing, or if it has any type other than `string`.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
message DeleteBookRequest {
  string book = 1;  // Field path should be `path`.
}
```

```proto
// Incorrect.
message DeleteBookRequest {
  bytes path = 1;  // Field type should be `string`.
}
```

**Correct** code for this rule:

```proto
// Correct.
message DeleteBookRequest {
  string path = 1;
}
```

## Disabling

If you need to violate this rule, use a leading comment above the message (if
the `path` field is missing) or above the field (if it is the wrong type).
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0135::request-path-field=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
message DeleteBookRequest {
  string book = 1;
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-135]: https://aep.dev/135
[aep.dev/not-precedent]: https://aep.dev/not-precedent
