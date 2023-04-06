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
}

export const enum FieldType {
  Dictionary = "dictionary",
  List = "list",
  Item = "item",
}

export const enum NumberOfDigits {
  MaxInteger = 15,
  MaxDecimal = 16,
  MaxIntegerPart = 12,
  MaxFractionPart = 3,
}
