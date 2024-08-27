---
title: Paginated methods- Page size field
rule:
  aep: 158
  name: [core, '0158', request-max-page-size-field]
  summary: Paginated RPCs must have a `max_page_size` field in the request.
permalink: /158/request-page-size-field
redirect_from:
  - /0158/request-page-size-field
---

# Paginated methods: Page size field

This rule enforces that all `List` and `Search` methods have a
`int32 page_size` field in the request message, as mandated in [AEP-158][].

## Details

This rule looks at any message matching `List*Request` or `Search*Request` and
complains if either the `page_size` field is missing, or if it has any type
other than `int32`.

## Examples

**Incorrect** code for this rule:

```proto
// Incorrect.
message ListBooksRequest {
  string path = 1;
  int32 limit = 2;  // Field name should be `page_size`.
  string page_token = 3;
}
```

```proto
// Incorrect.
message ListBooksRequest {
  string parent = 1;
  uint32 max_page_size = 2;  // Field type should be `int32`.
  string page_token = 3;
}
```

**Correct** code for this rule:

```proto
// Correct.
message ListBooksRequest {
  string parent = 1;
  int32 max_page_size = 2;
  string page_token = 3;
}
```

## Disabling

If you need to violate this rule, use a leading comment above the message (if
the `page_size` field is missing) or above the field (if it is the wrong type).
Remember to also include an [aep.dev/not-precedent][] comment explaining why.

```proto
// (-- api-linter: core::0158::request-page-size-field=disabled
//     aep.dev/not-precedent: We need to do this because reasons. --)
message ListBooksRequest {
  string path = 1;
  int32 limit = 2;
  string page_token = 3;
}
```

If you need to violate this rule for an entire file, place the comment at the
top of the file.

[aep-158]: https://aep.dev/158
[aep.dev/not-precedent]: https://aep.dev/not-precedent
