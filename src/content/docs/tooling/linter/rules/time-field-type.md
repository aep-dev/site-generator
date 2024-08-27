---
title: Timestamp field type
rule:
  aep: 142
  name: [core, '0142', time-field-type]
  summary: Timestamps should use `google.protobuf.Timestamp`.
permalink: /142/time-field-type
redirect_from:
  - /0142/time-field-type
---

# Timestamp field type

This rule enforces that timestamps are represented with
`google.protobuf.Timestamp`, as mandated in [AEP-142][].

## Details

This rule looks at each field and looks for common suffixes that indicate that
the field may represent time, and indicates that the
`google.protobuf.Timestamp` type should be used instead.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
message Book {
  string path = 1;
  int32 publish_time_sec = 2;  // Should use `google.protobuf.Timestamp`.
}
```

**Correct** code for this rule:

```proto
// Correct.
message Book {
  string path = 1;
  google.protobuf.Timestamp publish_time = 2;
}
```

## Disabling

If you need to violate this rule, use a leading comment above the method.
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0142::time-field-type=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
message Book {
  string path = 1;
  int32 publish_time_sec = 2;
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-142]: https://aep.dev/142
[aep.dev/not-precedent]: https://aep.dev/not-precedent
