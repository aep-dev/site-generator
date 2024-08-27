---
title: Timestamp field names
rule:
  aep: 142
  name: [core, '0142', time-field-names]
  summary: Timestamps should use `google.protobuf.Timestamp`.
permalink: /142/time-field-names
redirect_from:
  - /0142/time-field-names
---

# Timestamp field names

This rule enforces that timestamps are named using the imperative mood and with
a `_time` suffix, as mandated in [AEP-142][].

## Details

This rule looks at each `google.protobuf.Timestamp` field and ensures that it
has a `_time` suffix. If it is a repeated field, the `_times` suffix is also
allowed.

It also looks for common field names, regardless of type, and complains if they
are used. These are:

- created
- creation
- expired
- modified
- updated
- purged

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
message Book {
  string path = 1;
  google.protobuf.Timestamp published = 2;  // Should be `publish_time`.
  repeated google.protobuf.Timestamp updated = 3; // Should be `update_time` or `update_times`.
}
```

**Correct** code for this rule:

```proto
// Correct.
message Book {
  string path = 1;
  google.protobuf.Timestamp publish_time = 2;
  repeated google.protobuf.Timestamp update_times = 3;
}
```

## Disabling

If you need to violate this rule, use a leading comment above the method.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0142::time-field-names=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
message Book {
  string path = 1;
  google.protobuf.Timestamp published = 2;
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-142]: https://aep.dev/142
[aep.dev/not-precedent]: https://aep.dev/not-precedent
