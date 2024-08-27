---
title: Update methods- Mask field
rule:
  aep: 134
  name: [core, '0134', request-mask-field]
  summary: Update RPCs must have a field mask in the request.
permalink: /134/request-mask-field
redirect_from:
  - /0134/request-mask-field
---

# Update methods: Mask field

This rule enforces that all `Update` standard methods have a field in the
request message for the field mask, as mandated in [AEP-134][].

## Details

This rule looks at any message matching `Update*Request` and complains if
the `update_mask` field has any type other than `google.protobuf.FieldMask`.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
message UpdateBookRequest {
  Book book = 1;
  // Field type should be `google.protobuf.FieldMask`.
  string update_mask = 2;
}
```

**Correct** code for this rule:

```proto
// Correct.
message UpdateBookRequest {
  Book book = 1;
  google.protobuf.FieldMask update_mask = 2;
}
```

## Disabling

If you need to violate this rule, use a leading comment above the message (if
the resource field is missing) or above the field (if it is improperly named).
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
message UpdateBookRequest {
  Book book = 1;
  // (-- api-linter: core::0134::request-mask-field=disabled
  //     aep.dev/not-precedent: We need to do this because reasons. --)
  string update_mask = 2;
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-134]: https://aep.dev/134
[aep.dev/not-precedent]: https://aep.dev/not-precedent
