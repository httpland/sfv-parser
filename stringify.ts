// Copyright 2023-latest the httpland authors. All rights reserved. MIT license.
// This module is browser compatible.

import {
  BareItem,
  Boolean,
  Decimal,
  InnerList,
  Integer,
  Item,
  Kind,
  Parameters,
  Sfv,
  String,
  Token,
} from "./types.ts";
import {
  displayDecimal,
  displayInteger,
  displayKey,
  displayToken,
  divideOf,
  isTrue,
  numberOfDigits,
  toDecimalFormat,
} from "./utils.ts";
import { evenRoundBy } from "./deps.ts";
import { Bool, Char, NumberOfDigits } from "./constants.ts";
import { Binary, Dictionary, List } from "./mod.ts";
import { reVCHAR } from "./abnf.ts";

export function stringifySfv(input: Sfv): string {
  /** Specification:
   * 1. If the structure is a Dictionary or List and its value is empty (i.e., it has no members), do not serialize the field at all (i.e., omit both the field-name and field-value).
   * 2. If the structure is a List, let output_string be the result of running Serializing a List (Section 4.1.1) with the structure.
   * 3. Else, if the structure is a Dictionary, let output_string be the result of running Serializing a Dictionary (Section 4.1.2) with the structure.
   * 4. Else, if the structure is an Item, let output_string be the result of running Serializing an Item (Section 4.1.3) with the structure.
   * 5. Else, fail serialization.
   * 6. Return output_string converted into an array of bytes, using ASCII encoding [RFC0020].
   */

  switch (input.kind) {
    case "dictionary": {
      return stringifyDictionary(input);
    }
    case "item": {
      return stringifyItem(input);
    }
    case "list": {
      return stringifyList(input);
    }
  }
}

function stringifyList(input: List): string {
  /** Specification:
   * 1. Let output be an empty string.
   * 2. For each (member_value, parameters) of input_list:
   *  1. If member_value is an array, append the result of running Serializing an Inner List (Section 4.1.1.1) with (member_value, parameters) to output.
   *  2. Otherwise, append the result of running Serializing an Item (Section 4.1.3) with (member_value, parameters) to output.
   *  3. If more member_values remain in input_list:
   *    1. Append "," to output.
   *    2. Append a single SP to output.
   * 3. Return output.
   */

  const output = input.value
    .map(_stringifyItemOrInnerList)
    .join(Char.Separator);

  return output;
}

function _stringifyItemOrInnerList(input: Item | InnerList): string {
  if (input.kind === Kind.Item) return stringifyItem(input);

  return stringifyInnerList(input);
}

function stringifyDictionary(input: Dictionary): string {
  /** Specification:
   * 1. Let output be an empty string.
   * 2. For each member_key with a value of (member_value, parameters) in input_dictionary:
   *  1. Append the result of running Serializing a Key (Section 4.1.1.3) with member's member_key to output.
   *  2. If member_value is Boolean true:
   *    1. Append the result of running Serializing Parameters (Section 4.1.1.2) with parameters to output.
   *  3. Otherwise:
   *    1. Append "=" to output.
   *    2. If member_value is an array, append the result of running Serializing an Inner List (Section 4.1.1.1) with (member_value, parameters) to output.
   *    3. Otherwise, append the result of running Serializing an Item (Section 4.1.3) with (member_value, parameters) to output.
   *  4. If more members remain in input_dictionary:
   *    1. Append "," to output.
   *    2. Append a single SP to output.
   * 3. Return output.
   */

  const out = input.value
    .map(_stringifyEntry)
    .join(Char.Separator);

  return out;
}

function _stringifyEntry([key, value]: Dictionary["value"][number]): string {
  const keyFormat = stringifyKey(key);

  const valueFormat = value.kind === Kind.Item && isTrue(value.value[0])
    ? stringifyParameters(value.value[1])
    : Char.Eq + _stringifyItemOrInnerList(value);

  return keyFormat + valueFormat;
}

/** Serialize {@link Boolean} into string. */
export function stringifyBoolean(input: Boolean): string {
  return Char.Question + (input.value ? Bool.True : Bool.False);
}

export function stringifyString(input: String): string {
  let output: string = Char.DQuote;
  for (const char of input.value) {
    if (!(Char.Space === char || reVCHAR.test(char))) {
      throw TypeError();
    }

    if (Char.BackSlash === char || char === Char.DQuote) {
      output += Char.BackSlash;
    }

    output += char;
  }

  return output + Char.DQuote;
}

const ReTchar = /^[!#$%&'*+.^_`|~\dA-Za-z-]$/;

/** Serialize {@link Token} into string.
 * @param input Any {@link Token}.
 *
 * @throws {KindError}
 */
export function stringifyToken(input: Token): string {
  const [head, tail] = divideOf(1, input.value);

  if (!head || !/^[A-Za-z*]$/.test(head)) {
    throw TypeError(`invalid ${displayToken(input)} format.`);
  }

  for (const str of tail) {
    if (str !== Char.Colon && str !== Char.Slash && !ReTchar.test(str)) {
      throw TypeError(`invalid ${displayToken(input)} format.`);
    }
  }

  return input.value;
}

/** Serialize {@link Decimal} into string.
 * @param input Any {@link Decimal}.
 *
 * @throws {RangeError}
 */
export function stringifyDecimal(input: Decimal): string {
  if (!Number.isFinite(input.value)) {
    throw RangeError(`${displayDecimal(input)} must be finite.`);
  }

  const value = evenRoundBy(input.value, 3);
  const digitNumber = numberOfDigits(value);

  if (NumberOfDigits.MaxIntegerPart < digitNumber) {
    throw RangeError(
      `${
        displayDecimal(input)
      } integer component must be less than or equal to 12 digits.`,
    );
  }

  return toDecimalFormat(value);
}

/** Serialize {@link BareItem} into string.
 *
 * @throws {KindError}
 * @throws {RangeError}
 */
export function stringifyBareItem(input: BareItem): string {
  switch (input.kind) {
    case Kind.String: {
      return stringifyString(input);
    }
    case Kind.Token: {
      return stringifyToken(input);
    }
    case Kind.Decimal: {
      return stringifyDecimal(input);
    }
    case Kind.Integer: {
      return stringifyInteger(input);
    }
    case Kind.Binary: {
      return stringifyBinary(input);
    }

    case Kind.Boolean: {
      return stringifyBoolean(input);
    }

    default: {
      throw Error("unreachable");
    }
  }
}

const enum Range {
  Minimum = -999999999999999,
  Maximum = 999999999999999,
}

/** Serialize {@link Integer} into string.
 * @param input Any {@link Integer}.
 *
 * @throws {RangeError}
 */
export function stringifyInteger(input: Integer): string {
  if (!Number.isInteger(input.value)) {
    throw RangeError(`${displayInteger(input)} must be integer.`);
  }

  if (Range.Minimum > input.value) {
    throw RangeError(
      `${
        displayInteger(input)
      } must be greater than or equal to ${Range.Minimum}.`,
    );
  }

  if (input.value > Range.Maximum) {
    throw RangeError(
      `${
        displayInteger(input)
      } must be less than or equal to ${Range.Maximum}.`,
    );
  }

  return input.value.toString();
}

/** Serialize {@link Item} into string.
 * @param input Any {@link Item}.
 *
 * @throws {KindError}
 * @throws {RangeError}
 */
export function stringifyItem(input: Item): string {
  const [bareItem, parameters] = input.value;

  return stringifyBareItem(bareItem) + stringifyParameters(parameters);
}

/** Serialize {@link Parameters} into string.
 * @param input Any {@link Parameters}.
 *
 * @throws {KindError}
 * @throws {RangeError}
 */
export function stringifyParameters(input: Parameters): string {
  let output = "";

  for (const [key, param] of input.value) {
    output += Char.SemiColon;
    output += stringifyKey(key);

    if (isTrue(param)) continue;

    output += Char.Eq;
    output += stringifyBareItem(param);
  }

  return output;
}

const ReParamKey = /^[a-z*][a-z\d_.*-]*$/;

/** Serialize {@link Key} into string.
 * @param input Any {@link Key}.
 *
 * @throws {KindError}
 */
export function stringifyKey(input: string): string {
  if (!ReParamKey.test(input)) {
    throw TypeError(`${displayKey(input)} is invalid format.`);
  }

  return input;
}

/** Serialize {@link InnerList} into string.
 * @param input Any {@link InnerList}.
 *
 * @throws {KindError}
 * @throws {RangeError}
 */
export function stringifyInnerList(input: InnerList): string {
  const [list, parameters] = input.value;

  const output = Char.LParen + list.map(stringifyItem).join(Char.Space) +
    Char.RParen +
    stringifyParameters(parameters);

  return output;
}

export function stringifyBinary(input: Binary): string {
  return Char.Colon + btoa(new TextDecoder().decode(input.value)) + Char.Colon;
}
