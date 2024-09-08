---
title: Undelete methods- Resource reference
rule:
  aep: 164
  name: [core, '0164', request-name-reference]
  summary: |
    Undelete RPCs should annotate the `name` field with `google.api.resource_reference`.
permalink: /164/request-name-reference
redirect_from:
  - /0164/request-name-reference
---

# Undelete methods: Resource reference

This rule enforces that all `Undelete` methods have
`google.api.resource_reference` on their `string name` field, as mandated in
[AEP-164][].

## Details

This rule looks at the `name` field of any message matching `Undelete*Request`
and complains if it does not have a `google.api.resource_reference` annotation.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
message UndeleteBookRequest {
  // The `google.api.resource_reference` annotation should also be included.
  string name = 1 [(google.api.field_behavior) = REQUIRED];
}
```

**Correct** code for this rule:

```proto
// Correct.
message UndeleteBookRequest {
  string name = 1 [
    (google.api.field_behavior) = REQUIRED,
    (google.api.resource_reference).type = "library.googleapis.com/Book"
  ];
}
```

## Disabling

If you need to violate this rule, use a leading comment above the field.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
message UndeleteBookRequest {
  // (-- api-linter: core::0164::request-name-reference=disabled
  //     aep.dev/not-precedent: We need to do this because reasons. --)
  string name = 1 [(google.api.field_behavior) = REQUIRED];
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-164]: https://aep.dev/164
[aep.dev/not-precedent]: https://aep.dev/not-precedent
