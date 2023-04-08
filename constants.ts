// Copyright 2023-latest the httpland authors. All rights reserved. MIT license.
// This module is browser compatible.

/** Special character. */
export const enum Char {
  Space = " ",
  Comma = ",",
  LParen = "(",
  RParen = ")",
  Eq = "=",
  Question = "?",
  DQuote = `"`,
  BackSlash = "\\",
  Colon = ":",
  SemiColon = ";",
  Hyphen = "-",
  Period = ".",
  Star = "*",
  Underscore = "_",
  Slash = "/",
  Separator = Char.Comma + Char.Space,
}

export const enum NumberOfDigits {
  MaxInteger = 15,
  MaxIntegerPart = 12,
  MaxFractionPart = 3,
  MaxDecimal = NumberOfDigits.MaxIntegerPart + NumberOfDigits.MaxFractionPart +
    1,
}

export const enum Sign {
  Plus = 1,
  Minus = -Sign.Plus,
}

export const enum Bool {
  False = "0",
  True = "1",
}

/** Structured field values data type. */
export enum Type {
  String = "String",
  Token = "Token",
  Integer = "Integer",
  Decimal = "Decimal",
  Binary = "Binary",
  Boolean = "Boolean",
  List = "List",
  Item = "Item",
  Dictionary = "Dictionary",
  Parameters = "Parameters",
  InnerList = "InnerList",
}

/** Error message. */
export const enum Msg {
  Unreachable = "unreachable",
}

export const TRUE = { type: Type.Boolean, value: true } as const;

export const enum SubType {
  BareItem = "BareItem",
  Key = "Key",
}
