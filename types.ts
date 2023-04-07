// Copyright 2023-latest the httpland authors. All rights reserved. MIT license.
// This module is browser compatible.

import { Kind } from "./constants.ts";

interface Node {
  readonly kind: string;
}

export interface SfNode extends Node {
  readonly kind: `${Kind}`;
  readonly value: unknown;
}

export class Boolean implements SfNode {
  readonly kind: `${Kind.Boolean}`;
  readonly value: boolean;

  constructor(value: boolean) {
    this.kind = Kind.Boolean;
    this.value = value;
  }
}

export class String implements SfNode {
  readonly kind: `${Kind.String}`;
  readonly value: string;

  constructor(value: string) {
    this.value = value;
    this.kind = Kind.String;
  }
}

export class Token implements SfNode {
  readonly kind: `${Kind.Token}`;
  readonly value: string;

  constructor(value: string) {
    this.kind = Kind.Token;
    this.value = value;
  }
}

export class Integer implements SfNode {
  readonly kind: `${Kind.Integer}`;

  readonly value: number;

  constructor(value: number) {
    this.kind = Kind.Integer;
    this.value = value;
  }
}

export class Decimal implements SfNode {
  readonly kind: `${Kind.Decimal}`;
  readonly value: number;

  constructor(value: number) {
    this.kind = Kind.Decimal;
    this.value = value;
  }
}

export class Binary implements SfNode {
  readonly kind: `${Kind.Binary}`;
  readonly value: Uint8Array;

  constructor(value: Uint8Array) {
    this.value = value;
    this.kind = Kind.Binary;
  }
}

export class Item implements SfNode {
  readonly kind: `${Kind.Item}`;
  readonly value: readonly [bareItem: BareItem, parameters: Parameters];

  constructor(
    value: readonly [bareItem: BareItem, parameters: Parameters],
  ) {
    this.kind = Kind.Item;
    this.value = value;
  }
}

export class List implements SfNode {
  readonly kind: `${Kind.List}`;
  readonly value: readonly (Item | InnerList)[];

  constructor(value: readonly (Item | InnerList)[] = []) {
    this.kind = Kind.List;
    this.value = value;
  }
}

export class Dictionary implements SfNode {
  readonly kind: `${Kind.Dictionary}`;
  readonly value: readonly [key: string, value: Item | InnerList][];

  constructor(
    value:
      | [key: string, value: Item | InnerList][]
      | Record<string, Item | InnerList> = [],
  ) {
    this.kind = Kind.Dictionary;
    this.value = Array.isArray(value) ? value : Object.entries(value);
  }
}

export class InnerList implements SfNode {
  readonly kind: `${Kind.InnerList}`;
  readonly value: readonly [Item[], Parameters];

  constructor(value: readonly [Item[], Parameters]) {
    this.kind = Kind.InnerList;
    this.value = value;
  }
}

export class Parameters implements SfNode {
  readonly kind: `${Kind.Parameters}`;
  readonly value: readonly [key: string, value: BareItem][];

  constructor(
    value:
      | [key: string, value: BareItem][]
      | Record<string, BareItem> = [],
  ) {
    this.kind = Kind.Parameters;
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
