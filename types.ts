// Copyright 2023-latest the httpland authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isArray } from "./deps.ts";
import { Type } from "./constants.ts";

/** Node definition. */
interface Node {
  /** Node type. */
  readonly type: string;
}

/** Structured field API. */
export interface SfNode extends Node {
  /** Structured field type. */
  readonly type: `${Type}`;

  /** Structured field value. */
  readonly value: unknown;
}

/** List API.
 * Representation of [Rfc 8941, 3.1. Lists](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.1).
 */
export class List implements SfNode {
  readonly type: `${Type.List}`;
  readonly value: readonly (Item | InnerList)[];

  /**
   * @example
   * ```ts
   * import {
   *   type InnerList,
   *   type Item,
   *   List,
   * } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";
   *
   * declare const input: (Item | InnerList)[];
   * const list = new List(input);
   * ```
   */
  constructor(value: readonly (Item | InnerList)[] = []) {
    this.type = Type.List;
    this.value = value;
  }
}

/** Inner List API.
 * Representation of [Rfc 8941, 3.1.1. Inner Lists](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.1.1).
 */
export class InnerList implements SfNode {
  readonly type: `${Type.InnerList}`;
  readonly value: readonly [readonly Item[], Parameters];

  /**
   * @example
   * ```ts
   * import {
   *   InnerList,
   *   type Item,
   *   type Parameters,
   * } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";
   *
   * declare const items: Item[];
   * declare const parameters: Parameters;
   * const innerList = new InnerList([items, parameters]);
   * ```
   */
  constructor(value: readonly [readonly Item[], Parameters]) {
    this.type = Type.InnerList;
    this.value = value;
  }
}

/** Parameters API.
 * Representation of [Rfc 8941, 3.1.2. Parameters](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.1.2).
 */
export class Parameters implements SfNode {
  readonly type: `${Type.Parameters}`;
  readonly value: readonly (readonly [key: string, value: BareItem])[];

  /**
   * @example
   * ```ts
   * import {
   *   type BareItem,
   *   Parameters,
   * } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";
   *
   * declare const bareItem: BareItem;
   * const parameters = new Parameters({
   *   "<key>": bareItem,
   * });
   * ```
   */
  constructor(
    value:
      | readonly (readonly [key: string, value: BareItem])[]
      | Record<string, BareItem> = [],
  ) {
    this.type = Type.Parameters;
    this.value = isArray(value) ? value : Object.entries(value);
  }
}

/** Dictionary API.
 * Representation of [Rfc 8941, 3.2. Dictionaries](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.2).
 */
export class Dictionary implements SfNode {
  readonly type: `${Type.Dictionary}`;
  readonly value: readonly (readonly [key: string, value: Item | InnerList])[];

  /**
   * @example
   * ```ts
   * import {
   *   Dictionary,
   *   type InnerList,
   *   type Item,
   * } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";
   *
   * declare const input: Item | InnerList;
   * const dictionary = new Dictionary({ "<key>": input });
   * ```
   */
  constructor(
    value:
      | readonly (readonly [key: string, value: Item | InnerList])[]
      | Record<string, Item | InnerList> = [],
  ) {
    this.type = Type.Dictionary;
    this.value = isArray(value) ? value : Object.entries(value);
  }
}

/** Item API.
 * Representation of [Rfc 8941, 3.3. Items](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3).
 */
export class Item implements SfNode {
  readonly type: `${Type.Item}`;
  readonly value: readonly [bareItem: BareItem, parameters: Parameters];

  /**
   * @example
   * ```ts
   * import {
   *   type BareItem,
   *   Item,
   *   type Parameters,
   * } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";
   *
   * declare const bareItem: BareItem;
   * declare const parameters: Parameters;
   *
   * const item = new Item([bareItem, parameters]);
   * ```
   */
  constructor(
    value: readonly [bareItem: BareItem, parameters: Parameters],
  ) {
    this.type = Type.Item;
    this.value = value;
  }
}

/** Integer APi.
 * Representation of [RFC 8941, 3.3.1. Integers](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.1).
 */
export class Integer implements SfNode {
  readonly type: `${Type.Integer}`;

  readonly value: number;

  /**
   * @example
   * ```ts
   * import { Integer } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";
   *
   * declare const input: number;
   * const integer = new Integer(input);
   * ```
   */
  constructor(value: number) {
    this.type = Type.Integer;
    this.value = value;
  }
}

/** Decimal APi.
 * Representation of [Rfc 8941, 3.3.2. Decimals](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.2).
 */
export class Decimal implements SfNode {
  readonly type: `${Type.Decimal}`;
  readonly value: number;

  /**
   * @example
   * ```ts
   * import { Decimal } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";
   *
   * declare const input: number;
   * const decimal = new Decimal(input);
   * ```
   */
  constructor(value: number) {
    this.type = Type.Decimal;
    this.value = value;
  }
}

/** String API.
 * Representation of [Rfc 8941, 3.3.3. Strings](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.3).
 */
export class String implements SfNode {
  readonly type: `${Type.String}`;
  readonly value: string;

  /**
   * @example
   * ```ts
   * import { String } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";
   *
   * declare const input: string;
   * const string = new String(input);
   * ```
   */
  constructor(value: string) {
    this.value = value;
    this.type = Type.String;
  }
}

/** Token APi.
 * Representation of [RFC 8941, 3.3.4. Tokens](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.4).
 */
export class Token implements SfNode {
  readonly type: `${Type.Token}`;
  readonly value: string;

  /**
   * @example
   * ```ts
   * import { Token } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";
   *
   * declare const input: string;
   * const token = new Token(input);
   * ```
   */
  constructor(value: string) {
    this.type = Type.Token;
    this.value = value;
  }
}

/** Binary API.
 * Representation of [Rfc 8941,3.3.5. Byte Sequences](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.5).
 */
export class Binary implements SfNode {
  readonly type: `${Type.Binary}`;
  readonly value: Uint8Array;

  /**
   * @example
   * ```ts
   * import { Binary } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";
   *
   * declare const input: Uint8Array;
   * const binary = new Binary(input);
   * ```
   */
  constructor(value: Uint8Array) {
    this.value = value;
    this.type = Type.Binary;
  }
}

/** Boolean API.
 * Representation of [Rfc 8941, 3.3.6. Booleans](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.6).
 */
export class Boolean implements SfNode {
  readonly type: `${Type.Boolean}`;
  readonly value: boolean;

  /**
   * @example
   * ```ts
   * import { Boolean } from "https://deno.land/x/sfv_parser@$VERSION/types.ts";
   *
   * declare const input: boolean;
   * const boolean = new Boolean(input);
   * ```
   */
  constructor(value: boolean) {
    this.type = Type.Boolean;
    this.value = value;
  }
}

/** Bare item. */
export type BareItem =
  | Boolean
  | String
  | Token
  | Integer
  | Decimal
  | Binary;

/** Structured field values. */
export type Sfv = Dictionary | Item | List;
