---
title: Update methods- Allow missing
rule:
  aep: 134
  name: [core, '0134', request-allow-missing-field]
  summary: |
    Update RPCs on declarative-friendly resources should include allow_missing.
permalink: /134/request-allow-missing-field
redirect_from:
  - /0134/request-allow-missing-field
---

# Update methods: Allow missing

This rule enforces that all `Update` standard methods for declarative-friendly
resources ([AEP-128][]) have a `bool allow_missing` field, as mandated in
[AEP-134][].

## Details

This rule looks at any message matching `Update*Request` and complains if the
`bool allow_missing` field is not found.

**Important:** This rule is only active if the corresponding resource is
designated as declarative-friendly.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
message UpdateBookRequest {
  Book book = 1;
  google.protobuf.FieldMask update_mask = 2;
  // Needs `bool allow_missing`
}
```

**Correct** code for this rule:

```proto
// Correct.
message UpdateBookRequest {
  Book book = 1;
  google.protobuf.FieldMask update_mask = 2;
  bool allow_missing = 3;
}
```

## Disabling

If you need to violate this rule, use a leading comment above the field.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0134::request-allow-missing-field=disabled
//     aep.dev/not-precedent: We really need this field because reasons. --)
message UpdateBookRequest {
  Book book = 1;
  google.protobuf.FieldMask update_mask = 2;
}
```

**Note:** Violations of declarative-friendly rules should be rare, as tools are
likely to expect strong consistency.

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-134]: https://aep.dev/134
[aep-155]: https://aep.dev/155
[aep.dev/not-precedent]: https://aep.dev/not-precedent
