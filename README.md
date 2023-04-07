# sfv-parser

[![deno land](http://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno)](https://deno.land/x/sfv_parser)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/sfv_parser/mod.ts)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/httpland/sfv-parser)](https://github.com/httpland/sfv-parser/releases)
[![codecov](https://codecov.io/github/httpland/sfv-parser/branch/main/graph/badge.svg?token=MNFZEQH8OK)](https://codecov.io/gh/httpland/sfv-parser)
[![GitHub](https://img.shields.io/github/license/httpland/sfv-parser)](https://github.com/httpland/sfv-parser/blob/main/LICENSE)

[![test](https://github.com/httpland/sfv-parser/actions/workflows/test.yaml/badge.svg)](https://github.com/httpland/sfv-parser/actions/workflows/test.yaml)
[![NPM](https://nodei.co/npm/@httpland/sfv-parser.png?mini=true)](https://nodei.co/npm/@httpland/sfv-parser/)

**S**tructured **F**ield **V**alues for HTTP parser and serializer.

Compliant with
[RFC 8941, Structured Field Values for HTTP](https://www.rfc-editor.org/rfc/rfc8941.html#name-lists).

## Parsing

Specify field value and field type(`list`, `dictionary`, `item`) for parser.

```ts
import { parseSfv } from "https://deno.land/x/sfv_parser@$VERSION/parse.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const result = parseSfv("sugar, tea, rum", "List");

assertEquals(result, {
  "type": "List",
  "value": [
    {
      "type": "Item",
      "value": [
        { "type": "Token", "value": "sugar" },
        { "type": "Parameters", "value": [] },
      ],
    },
    {
      "type": "Item",
      "value": [
        { "type": "Token", "value": "tea" },
        { "type": "Parameters", "value": [] },
      ],
    },
    {
      "type": "Item",
      "value": [
        { "type": "Token", "value": "rum" },
        { "type": "Parameters", "value": [] },
      ],
    },
  ],
});
```

### Syntax error

If field value has an invalid syntax, it may throw a `SyntaxError`.

```ts
import { parseSfv } from "https://deno.land/x/sfv_parser@$VERSION/parse.ts";
import { assertThrows } from "https://deno.land/std/testing/asserts.ts";

assertThrows(() => parseSfv("this, is, list", "Dictionary"));
```

## Serialization

Serialize structured field values into string.

```ts
import { stringifySfv } from "https://deno.land/x/sfv_parser@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const sfv = {
  "type": "List",
  "value": [
    {
      "type": "Item",
      "value": [
        { "type": "Token", "value": "sugar" },
        { "type": "Parameters", "value": [] },
      ],
    },
    {
      "type": "Item",
      "value": [
        { "type": "Token", "value": "tea" },
        { "type": "Parameters", "value": [] },
      ],
    },
    {
      "type": "Item",
      "value": [
        { "type": "Token", "value": "rum" },
        { "type": "Parameters", "value": [] },
      ],
    },
  ],
} as const;

assertEquals(stringifySfv(sfv), "sugar, tea, rum");
```

## License

Copyright © 2023-present [httpland](https://github.com/httpland).

Released under the [MIT](./LICENSE) license
