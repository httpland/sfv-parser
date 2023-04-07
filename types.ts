// Copyright 2023-latest the httpland authors. All rights reserved. MIT license.
// This module is browser compatible.

import { Type } from "./constants.ts";

/** Node definition. */
interface Node {
  /** Node type. */
  readonly type: string;
}

export interface SfNode extends Node {
  readonly type: `${Type}`;
  readonly value: unknown;
}

export class Boolean implements SfNode {
  readonly type: `${Type.Boolean}`;
  readonly value: boolean;

  constructor(value: boolean) {
    this.type = Type.Boolean;
    this.value = value;
  }
}

export class String implements SfNode {
  readonly type: `${Type.String}`;
  readonly value: string;

  constructor(value: string) {
    this.value = value;
    this.type = Type.String;
  }
}

export class Token implements SfNode {
  readonly type: `${Type.Token}`;
  readonly value: string;

  constructor(value: string) {
    this.type = Type.Token;
    this.value = value;
  }
}

export class Integer implements SfNode {
  readonly type: `${Type.Integer}`;

  readonly value: number;

  constructor(value: number) {
    this.type = Type.Integer;
    this.value = value;
  }
}

export class Decimal implements SfNode {
  readonly type: `${Type.Decimal}`;
  readonly value: number;

  constructor(value: number) {
    this.type = Type.Decimal;
    this.value = value;
  }
}

export class Binary implements SfNode {
  readonly type: `${Type.Binary}`;
  readonly value: Uint8Array;

  constructor(value: Uint8Array) {
    this.value = value;
    this.type = Type.Binary;
  }
}

export class Item implements SfNode {
  readonly type: `${Type.Item}`;
  readonly value: readonly [bareItem: BareItem, parameters: Parameters];

  constructor(
    value: readonly [bareItem: BareItem, parameters: Parameters],
  ) {
    this.type = Type.Item;
    this.value = value;
  }
}

export class List implements SfNode {
  readonly type: `${Type.List}`;
  readonly value: readonly (Item | InnerList)[];

  constructor(value: readonly (Item | InnerList)[] = []) {
    this.type = Type.List;
    this.value = value;
  }
}

export class Dictionary implements SfNode {
  readonly type: `${Type.Dictionary}`;
  readonly value: readonly [key: string, value: Item | InnerList][];

  constructor(
    value:
      | [key: string, value: Item | InnerList][]
      | Record<string, Item | InnerList> = [],
  ) {
    this.type = Type.Dictionary;
    this.value = Array.isArray(value) ? value : Object.entries(value);
  }
}

export class InnerList implements SfNode {
  readonly type: `${Type.InnerList}`;
  readonly value: readonly [Item[], Parameters];

  constructor(value: readonly [Item[], Parameters]) {
    this.type = Type.InnerList;
    this.value = value;
  }
}

export class Parameters implements SfNode {
  readonly type: `${Type.Parameters}`;
  readonly value: readonly [key: string, value: BareItem][];

  constructor(
    value:
      | [key: string, value: BareItem][]
      | Record<string, BareItem> = [],
  ) {
    this.type = Type.Parameters;
    this.value = Array.isArray(value) ? value : Object.entries(value);
  }
}

export type BareItem =
  | Boolean
  | String
  | Token
  | Integer
  | Decimal
  | Binary;

/** Structured field values. */
export type Sfv = Dictionary | Item | List;
