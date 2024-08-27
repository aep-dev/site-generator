---
title: Update methods- Resource field
rule:
  aep: 134
  name: [core, '0134', request-resource-required]
  summary: Update RPCs must have a field for the resource in the request.
permalink: /134/request-resource-required
redirect_from:
  - /0134/request-resource-required
---

# Update methods: Resource field

This rule enforces that all `Update` standard methods have a field in the
request message for the resource itself, as mandated in [AEP-134][].

## Details

This rule looks at any message matching `Update*Request` and complains if there
is no field of the resource's type with the expected field name.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
// `Book book` is missing.
message UpdateBookRequest {
  google.protobuf.FieldMask update_mask = 2;
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

If you need to violate this rule, use a leading comment above the message.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0134::request-resource-required=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
message UpdateBookRequest {
  google.protobuf.FieldMask update_mask = 2;
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-134]: https://aep.dev/134
[aep.dev/not-precedent]: https://aep.dev/not-precedent
