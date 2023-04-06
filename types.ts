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
  Dictionary = "dictionary",
  Key = "key",
  InnerList = "inner-list",
}

interface Node {
  readonly kind: `${Kind}`;
}

export class Boolean implements Node {
  readonly kind: `${Kind.Boolean}` = Kind.Boolean;

  constructor(public readonly value: boolean) {}
}

export class String implements Node {
  readonly kind: `${Kind.String}` = Kind.String;

  constructor(public readonly value: string) {}
}

export class Token implements Node {
  readonly kind: `${Kind.Token}` = Kind.Token;

  constructor(public readonly value: string) {}
}

export class Integer implements Node {
  readonly kind: `${Kind.Integer}` = Kind.Integer;

  constructor(public readonly value: number) {}
}

export class Decimal implements Node {
  readonly kind: `${Kind.Decimal}` = Kind.Decimal;

  constructor(public readonly value: number) {}
}

export class ByteSequence implements Node {
  readonly kind: `${Kind.ByteSequence}` = Kind.ByteSequence;

  constructor(public readonly value: Uint8Array) {}
}

export type BareItem =
  | boolean
  | String
  | Token
  | Integer
  | Decimal
  | ByteSequence;

export type Item = [BareItem, Parameters];

export interface Parameters {
  readonly [k: string]: BareItem;
}

export interface Dictionary {
  readonly [k: string]: Item | InnerList;
}

export type InnerList = [Item[], Parameters];

export type List = (Item | InnerList)[];

export type Sfv = Dictionary | Item | List;
