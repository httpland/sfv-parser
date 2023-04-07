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
  Separator = `, `,
}

export const enum NumberOfDigits {
  MaxInteger = 15,
  MaxDecimal = 16,
  MaxIntegerPart = 12,
  MaxFractionPart = 3,
}

export const enum Sign {
  Plus = 1,
  Minus = -1,
}

export const enum Bool {
  False = "0",
  True = "1",
}

/** Structured field values node type. */
export const enum Type {
  String = "string",
  Token = "token",
  Integer = "integer",
  Decimal = "decimal",
  Binary = "binary",
  Boolean = "boolean",
  List = "list",
  Item = "item",
  Dictionary = "dictionary",
  Parameters = "parameters",
  InnerList = "inner-list",
}

/** Error message. */
export const enum Msg {
  Unreachable = "unreachable",
}

export const TRUE = { type: Type.Boolean, value: true } as const;

export const enum SubType {
  BareItem = "bare-item",
  Key = "key",
}
