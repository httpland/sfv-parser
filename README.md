# sfv-parser

[![deno land](http://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno)](https://deno.land/x/sfv_parser)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/sfv_parser/mod.ts)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/httpland/sfv-parser)](https://github.com/httpland/sfv-parser/releases)
[![codecov](https://codecov.io/github/httpland/sfv-parser/branch/main/graph/badge.svg)](https://codecov.io/gh/httpland/sfv-parser)
[![GitHub](https://img.shields.io/github/license/httpland/sfv-parser)](https://github.com/httpland/sfv-parser/blob/main/LICENSE)

[![test](https://github.com/httpland/sfv-parser/actions/workflows/test.yaml/badge.svg)](https://github.com/httpland/sfv-parser/actions/workflows/test.yaml)
[![NPM](https://nodei.co/npm/@httpland/sfv-parser.png?mini=true)](https://nodei.co/npm/@httpland/sfv-parser/)

**S**tructured **F**ield **V**alues for HTTP parser and serializer.

Compliant with
[RFC 8941, Structured Field Values for HTTP](https://www.rfc-editor.org/rfc/rfc8941.html#name-lists).

## Documentation

- [Structured data types](./docs/data-types.md)

## Parsing

Specify field value and field type(`List`, `Dictionary`, `Item`) for parser.

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

Serialize [Sfv](./docs/data-types.md#sfv) into string.

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

### RangeError

The range of possible values for `Integer` and `Decimal` is specified. If this
is violated, `RangeError` may be thrown.

For example, the possible values of type `Integer` range from
`-999,999,999,999,999` to `999,999,999,999,999`.

```ts
import {
  Dictionary,
  Integer,
  Item,
  Parameters,
  stringifySfv,
} from "https://deno.land/x/sfv_parser@$VERSION/mod.ts";
import { assertThrows } from "https://deno.land/std/testing/asserts.ts";

const sfv = new Dictionary({
  foo: new Item(
    [new Integer(10e14), new Parameters()],
  ),
});

assertThrows(() => stringifySfv(sfv));
```

### TypeError

If Data type contains invalid characters, it may throw `TypeError`.

For example, `Token` must be compliant with
[`<sf-token>`](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.4-3).

```ts
import {
  Item,
  List,
  Parameters,
  stringifySfv,
  Token,
} from "https://deno.land/x/sfv_parser@$VERSION/mod.ts";
import { assertThrows } from "https://deno.land/std/testing/asserts.ts";

const sfv = new List([
  new Item(
    [new Token("<invalid>"), new Parameters()],
  ),
]);

assertThrows(() => stringifySfv(sfv));
```

## Type constructor

Provides a utility of type constructor for
[structured data types](./docs/data-types.md).

This saves you the trouble of typing the `type` field.

### List

Representation of
[Rfc 8941, 3.1. Lists](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.1).

```ts
import {
  type InnerList,
  type Item,
  List,
} from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

declare const input: (Item | InnerList)[];
const list = new List(input);
```

yield:

```json
{
  "type": "List",
  "value": "<Item | InnerList>[]"
}
```

### InnerList

Representation of
[Rfc 8941, 3.1.1. Inner Lists](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.1.1).

```ts
import {
  InnerList,
  type Item,
  type Parameters,
} from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

declare const items: Item[];
declare const parameters: Parameters;
const innerList = new InnerList([items, parameters]);
```

yield:

```json
{
  "type": "InnerList",
  "value": ["<Item>[]", "<Parameters>"]
}
```

### Parameters

Representation of
[Rfc 8941, 3.1.2. Parameters](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.1.2).

```ts
import {
  type BareItem,
  Parameters,
} from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

declare const bareItem: BareItem;
const parameters = new Parameters({
  "<key>": bareItem,
});
```

or,

```ts
import {
  type BareItem,
  Parameters,
} from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

declare const bareItem: BareItem;
const parameters = new Parameters([
  ["<key>", bareItem],
]);
```

yield:

```json
{
  "type": "Boolean",
  "value": "[string, <BareItem>][]"
}
```

### Dictionary

Representation of
[Rfc 8941, 3.2. Dictionaries](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.2).

```ts
import {
  Dictionary,
  type InnerList,
  type Item,
} from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

declare const input: Item | InnerList;
const dictionary = new Dictionary({ "<key>": input });
```

or,

```ts
import {
  Dictionary,
  type InnerList,
  type Item,
} from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

declare const input: Item | InnerList;
const dictionary = new Dictionary([
  ["<key>", input],
]);
```

yield:

```json
{
  "type": "Dictionary",
  "value": "[string, <Item | InnerList>][]"
}
```

### Item

Representation of
[Rfc 8941, 3.3. Items](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3).

```ts
import {
  type BareItem,
  Item,
  type Parameters,
} from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

declare const bareItem: BareItem;
declare const parameters: Parameters;

const item = new Item([bareItem, parameters]);
```

yield:

```json
{
  "type": "Item",
  "value": ["<BareItem>", "<Parameters>"]
}
```

### Integer

Representation of
[RFC 8941, 3.3.1. Integers](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.1).

```ts
import { Integer } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

declare const input: number;
const integer = new Integer(input);
```

yield:

```json
{
  "type": "Integer",
  "value": "<number>"
}
```

### Decimal

Representation of
[Rfc 8941, 3.3.2. Decimals](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.2).

```ts
import { Decimal } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

declare const input: number;
const decimal = new Decimal(input);
```

yield:

```json
{
  "type": "Decimal",
  "value": "<number>"
}
```

### String

Representation of
[Rfc 8941, 3.3.3. Strings](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.3).

```ts
import { String } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

declare const input: string;
const string = new String(input);
```

yield:

```json
{
  "type": "String",
  "value": "<string>"
}
```

### Token

Representation of
[RFC 8941, 3.3.4. Tokens](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.4).

```ts
import { Token } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

declare const input: string;
const token = new Token(input);
```

yield:

```json
{
  "type": "Token",
  "value": "<string>"
}
```

### Binary

Representation of
[Rfc 8941,3.3.5. Byte Sequences](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.5).

```ts
import { Binary } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

declare const input: Uint8Array;
const binary = new Binary(input);
```

yield:

```json
{
  "type": "Binary",
  "value": "<Uint8Array>"
}
```

### Boolean

Representation of
[Rfc 8941, 3.3.6. Booleans](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.6).

```ts
import { Boolean } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

declare const input: boolean;
const boolean = new Boolean(input);
```

yield:

```json
{
  "type": "Boolean",
  "value": "<boolean>"
}
```

## Coverage

All test cases in
[structured-field-tests](https://github.com/httpwg/structured-field-tests) have
been passed.

[All test case](./e2e_test.ts)

## API

All APIs can be found in the
[deno doc](https://doc.deno.land/https/deno.land/x/sfv_parser/mod.ts).

## License

Copyright © 2023-present [httpland](https://github.com/httpland).

Released under the [MIT](./LICENSE) license
