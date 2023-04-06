// Copyright 2023-latest the httpland authors. All rights reserved. MIT license.
// This module is browser compatible.

export const enum Kind {
  String = "string",
  Token = "token",
  Integer = "integer",
  Decimal = "decimal",
  ByteSequence = "byte-sequence",
  Boolean = "boolean",
  List = "list",
  Item = "item",
  Dictionary = "dictionary",
  Parameters = "parameters",
  InnerList = "inner-list",
}

interface Node {
  readonly kind: string;
}

export interface SfNode extends Node {
  readonly kind: `${Kind}`;
}

export class Boolean implements SfNode {
  readonly kind: `${Kind.Boolean}` = Kind.Boolean;

  constructor(public readonly value: boolean) {}
}

export class String implements SfNode {
  readonly kind: `${Kind.String}` = Kind.String;

  constructor(public readonly value: string) {}
}

export class Token implements SfNode {
  readonly kind: `${Kind.Token}` = Kind.Token;

  constructor(public readonly value: string) {}
}

export class Integer implements SfNode {
  readonly kind: `${Kind.Integer}` = Kind.Integer;

  constructor(public readonly value: number) {}
}

export class Decimal implements SfNode {
  readonly kind: `${Kind.Decimal}` = Kind.Decimal;

  constructor(public readonly value: number) {}
}

export class ByteSequence implements SfNode {
  readonly kind: `${Kind.ByteSequence}` = Kind.ByteSequence;

  constructor(public readonly value: Uint8Array) {}
}

export class Item implements SfNode {
  readonly kind: `${Kind.Item}` = Kind.Item;

  constructor(
    public readonly value: readonly [
      bareItem: BareItem,
      parameters: Parameters,
    ],
  ) {}
}

export class List implements SfNode {
  readonly kind: `${Kind.List}` = Kind.List;

  constructor(public readonly value: readonly (Item | InnerList)[]) {}
}

export class Dictionary implements SfNode {
  readonly kind: `${Kind.Dictionary}` = Kind.Dictionary;

  constructor(
    public readonly value: readonly [key: string, value: Item | InnerList][],
  ) {}
}

export class InnerList implements SfNode {
  readonly kind: `${Kind.InnerList}` = Kind.InnerList;

  constructor(
    public readonly value: readonly [Item[], Parameters],
  ) {}
}

export class Parameters implements SfNode {
  readonly kind: `${Kind.Parameters}` = Kind.Parameters;

  constructor(public value: readonly [key: string, value: BareItem][]) {}
}

export type BareItem =
  | Boolean
  | String
  | Token
  | Integer
  | Decimal
  | ByteSequence;

/** Structured field values. */
export type Sfv = Dictionary | Item | List;
