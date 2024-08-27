---
title: Update methods- Resource field
rule:
  aep: 134
  name: [core, '0134', request-resource-field]
  summary: Update RPCs must have a field for the resource in the request.
permalink: /134/request-resource-field
redirect_from:
  - /0134/request-resource-field
---

# Update methods: Resource field

This rule enforces that all `Update` standard methods have a field in the
request message for the resource itself, as mandated in [AEP-134][].

## Details

This rule looks at any message matching `Update*Request` and complains if 
the field of the resource's type is not named properly.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
message UpdateBookRequest {
  // Field name should be `book`.
  Book payload = 1;
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

If you need to violate this rule, use a leading comment above the field.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
message UpdateBookRequest {
  // (-- api-linter: core::0134::request-resource-field=disabled
  //     aep.dev/not-precedent: We need to do this because reasons. --)
  Book payload = 1;
  google.protobuf.FieldMask update_mask = 2;
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-134]: https://aep.dev/134
[aep.dev/not-precedent]: https://aep.dev/not-precedent
