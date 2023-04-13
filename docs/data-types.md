# Structured data types

Structured data types used to parse and serialize structured field values.

## Common

All data types have following properties.

| Name  | Description                |
| ----- | -------------------------- |
| type  | [Date types](#date-types). |
| value | Actual data.               |

## Date types

Data type is not compatible with JSON.

Each data type is self-contained and isomorphic.

### List

```ts
import type {
  InnerList,
  Item,
} from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

interface List {
  type: "List";
  value: (Item | InnerList)[];
}
```

### Dictionary

```ts
import type {
  InnerList,
  Item,
} from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

interface Dictionary {
  type: "Dictionary";
  value: [string, Item | InnerList][];
}
```

An [ordered map](https://infra.spec.whatwg.org/#ordered-map) is represented by
an array of key and value entries.

### InnerList

```ts
import type {
  Item,
  Parameters,
} from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

interface InnerList {
  type: "InnerList";
  value: [Item[], Parameters];
}
```

### Item

```ts
import type {
  BareItem,
  Parameters,
} from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

interface Item {
  type: "Item";
  value: [BareItem, Parameters];
}
```

### Parameters

```ts
import type {
  BareItem,
} from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

interface Parameters {
  type: "Parameters";
  value: [string, BareItem][];
}
```

Ordered map

### Boolean

```ts
interface Boolean {
  type: "Boolean";
  value: boolean;
}
```

### Integer

```ts
interface Integer {
  type: "Integer";
  value: number;
}
```

### Decimal

```ts
interface Decimal {
  type: "Decimal";
  value: number;
}
```

### String

```ts
interface String {
  type: "String";
  value: string;
}
```

### Token

```ts
interface Token {
  type: "Token";
  value: string;
}
```

### Binary

```ts
interface Binary {
  type: "Binary";
  value: Uint8Array;
}
```

### Containers

Container is an alias for multiple data types.

#### BareItem

```ts
import type {
  Binary,
  Boolean,
  Decimal,
  Integer,
  String,
  Token,
} from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

type BareItem =
  | Boolean
  | String
  | Token
  | Integer
  | Decimal
  | Binary;
```

#### Sfv

```ts
import type {
  Dictionary,
  Item,
  List,
} from "https://deno.land/x/sfv_parser@$VERSION/types.ts";

type Sfv = Dictionary | Item | List;
```
