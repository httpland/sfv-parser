// Copyright 2023-latest the httpland authors. All rights reserved. MIT license.
// This module is browser compatible.

import {
  BareItem,
  Boolean,
  Decimal,
  InnerList,
  Integer,
  Item,
  Parameters,
  Sfv,
  String,
  Token,
} from "./types.ts";
import {
  displayKey,
  displaySfNode,
  divideOf,
  isTrue,
  numberOfDigits,
  toDecimalFormat,
} from "./utils.ts";
import { evenRoundBy } from "./deps.ts";
import { Bool, Char, Kind, Msg, NumberOfDigits } from "./constants.ts";
import { Binary, Dictionary, List } from "./mod.ts";
import { reALPHA, reParamKey, reTchar, reVCHAR } from "./abnf.ts";

/** Serialize {@link Sfv} into string.
 * @param input Any {@link Sfv}.
 *
 * @example
 * ```ts
 * import { stringifySfv } from "https://deno.land/x/sfv_parser@$VERSION/mod.ts";
 * import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
 *
 * const sfv = {
 *   "kind": "list",
 *   "value": [
 *     {
 *       "kind": "item",
 *       "value": [
 *         { "kind": "token", "value": "sugar" },
 *         { "kind": "parameters", "value": [] },
 *       ],
 *     },
 *     {
 *       "kind": "item",
 *       "value": [
 *         { "kind": "token", "value": "tea" },
 *         { "kind": "parameters", "value": [] },
 *       ],
 *     },
 *     {
 *       "kind": "item",
 *       "value": [
 *         { "kind": "token", "value": "rum" },
 *         { "kind": "parameters", "value": [] },
 *       ],
 *     },
 *   ],
 * } as const;
 *
 * assertEquals(stringifySfv(sfv), "sugar, tea, rum");
 * ```
 */
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

export function stringifyList(input: List): string {
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

export function stringifyDictionary(input: Dictionary): string {
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

/** Serialize {@link String} into string.
 *
 * @throws {TypeError} If the input is invalid [`<chr>`](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.3-3).
 */
export function stringifyString(input: String): string {
  let output: string = Char.DQuote;

  for (const char of input.value) {
    if (!(Char.Space === char || reVCHAR.test(char))) {
      throw TypeError(`invalid <${Abnf.Chr}> format. ${displaySfNode(input)}`);
    }

    if (Char.BackSlash === char || char === Char.DQuote) {
      output += Char.BackSlash;
    }

    output += char;
  }

  return output + Char.DQuote;
}

/** Serialize {@link Token} into string.
 * @param input Any {@link Token}.
 *
 * @throws {TypeError} If the input is invalid [`<sf-token>`](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.4-3).
 */
export function stringifyToken(input: Token): string {
  const nodeStr = displaySfNode.bind(null, input);
  const [head, tail] = divideOf(1, input.value);

  if (!(Char.Star === head || reALPHA.test(head))) {
    throw TypeError(`invalid <${Abnf.SfToken}> format. ${nodeStr()}`);
  }

  for (const str of tail) {
    if (str !== Char.Colon && str !== Char.Slash && !reTchar.test(str)) {
      throw TypeError(`invalid <${Abnf.SfToken}> format. ${nodeStr()} `);
    }
  }

  return input.value;
}

/** Serialize {@link Decimal} into string.
 * @param input Any {@link Decimal}.
 *
 * @throws {RangeError} If the input is invalid range.
 */
export function stringifyDecimal(input: Decimal): string {
  const nodeStr = displaySfNode.bind(null, input);

  if (!Number.isFinite(input.value)) {
    throw RangeError(`${Err.MustBeFinite} ${nodeStr()}`);
  }

  const value = evenRoundBy(input.value, 3);
  const digitNumber = numberOfDigits(value);

  if (NumberOfDigits.MaxIntegerPart < digitNumber) {
    throw RangeError(`${Err.InvalidMaxIntegerPart} ${nodeStr()}`);
  }

  return toDecimalFormat(value);
}

/** Serialize {@link BareItem} into string.
 *
 * @throws {TypeError}
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
      throw Error(Msg.Unreachable);
    }
  }
}

/** Serialize {@link Integer} into string.
 * @param input Any {@link Integer}.
 *
 * @throws {RangeError} If the input is invalid range.
 */
export function stringifyInteger(input: Integer): string {
  const nodeStr = displaySfNode.bind(null, input);

  if (!Number.isInteger(input.value)) {
    throw RangeError(`${Err.MustBeInteger} ${nodeStr()}`);
  }

  if (Range.Minimum > input.value) {
    throw RangeError(
      `${nodeStr()} must be greater than or equal to ${Range.Minimum}.`,
    );
  }

  if (input.value > Range.Maximum) {
    throw RangeError(
      `${nodeStr()} must be less than or equal to ${Range.Maximum}.`,
    );
  }

  return input.value.toString();
}

/** Serialize {@link Item} into string.
 * @param input Any {@link Item}.
 *
 * @throws {TypeError}
 * @throws {RangeError}
 */
export function stringifyItem(input: Item): string {
  const [bareItem, parameters] = input.value;

  return stringifyBareItem(bareItem) + stringifyParameters(parameters);
}

/** Serialize {@link Parameters} into string.
 * @param input Any {@link Parameters}.
 *
 * @throws {TypeError} If the input is invalid <key>.
 * @throws {RangeError} If the input is invalid range.
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

/** Serialize {@link Key} into string.
 * @param input Any {@link Key}.
 *
 * @throws {TypeError} If the input is invalid [`<key>`](https://www.rfc-editor.org/rfc/rfc8941.html#section-3.1.2-4).
 */
export function stringifyKey(input: string): string {
  if (!reParamKey.test(input)) {
    throw TypeError(`invalid <${Abnf.Key}> format. ${displayKey(input)}`);
  }

  return input;
}

/** Serialize {@link InnerList} into string.
 * @param input Any {@link InnerList}.
 *
 * @throws {TypeError}
 * @throws {RangeError}
 */
export function stringifyInnerList(input: InnerList): string {
  const [list, parameters] = input.value;

  const output = Char.LParen + list.map(stringifyItem).join(Char.Space) +
    Char.RParen +
    stringifyParameters(parameters);

  return output;
}

/** Serialize {@link Binary} into string. */
export function stringifyBinary(input: Binary): string {
  return Char.Colon + btoa(new TextDecoder().decode(input.value)) + Char.Colon;
}

const enum Abnf {
  SfToken = "sf-token",
  Chr = "chr",
  Key = "key",
}

const enum Err {
  InvalidMaxIntegerPart =
    "integer component must be less than or equal to 12 digits.",
  MustBeFinite = "must be finite.",
  MustBeInteger = "must be integer.",
}

const enum Range {
  Minimum = -999999999999999,
  Maximum = 999999999999999,
}
