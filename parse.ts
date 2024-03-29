// Copyright 2023-latest the httpland authors. All rights reserved. MIT license.
// This module is browser compatible.

import {
  BareItem,
  Binary,
  Boolean,
  Decimal,
  Dictionary,
  InnerList,
  Integer,
  Item,
  List,
  Parameters,
  Sfv,
  String,
  Token,
} from "./types.ts";
import { decode } from "./deps.ts";
import { decimalPlaces, divideBy, head, Scanner, trimStart } from "./utils.ts";
import {
  Bool,
  Char,
  Msg,
  NumberOfDigits,
  Sign,
  SubType,
  TRUE,
  Type,
} from "./constants.ts";
import {
  reALPHA,
  reBase64Alphabet,
  reDigit,
  reLcalpha,
  reTchar,
  reVCHAR,
} from "./abnf.ts";

/** Structured field type. */
export type FieldType = Type.List | Type.Item | Type.Dictionary;

/** Parse string into {@link List}.
 * @example
 * ```ts
 * import { parseSfv } from "https://deno.land/x/sfv_parser@$VERSION/parse.ts";
 * import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
 *
 * const result = parseSfv("sugar, tea, rum", "List");
 *
 * assertEquals(result, {
 *   "type": "List",
 *   "value": [
 *     {
 *       "type": "Item",
 *       "value": [
 *         { "type": "Token", "value": "sugar" },
 *         { "type": "Parameters", "value": [] },
 *       ],
 *     },
 *     {
 *       "type": "Item",
 *       "value": [
 *         { "type": "Token", "value": "tea" },
 *         { "type": "Parameters", "value": [] },
 *       ],
 *     },
 *     {
 *       "type": "Item",
 *       "value": [
 *         { "type": "Token", "value": "rum" },
 *         { "type": "Parameters", "value": [] },
 *       ],
 *     },
 *   ],
 * });
 * ```
 *
 * @throws {SyntaxError} If the input is invalid syntax.
 */
export function parseSfv(filedValue: string, fieldType: `${Type.List}`): List;

/** Parse string into {@link Item}.  */
export function parseSfv(filedValue: string, fieldType: `${Type.Item}`): Item;

/** Parse string into {@link Dictionary}.  */
export function parseSfv(
  filedValue: string,
  fieldType: `${Type.Dictionary}`,
): Dictionary;

/** Parse string into {@link Sfv}.  */
export function parseSfv(fieldValue: string, fieldType: `${FieldType}`): Sfv;
export function parseSfv(fieldValue: string, fieldType: `${FieldType}`): Sfv {
  /**
   * 1. Convert input_bytes into an ASCII string input_string; if conversion fails, fail parsing.
   * 2. Discard any leading SP characters from input_string.
   * 3. If field_type is "list", let output be the result of running Parsing a List (Section 4.2.1) with input_string.
   * 4. If field_type is "dictionary", let output be the result of running Parsing a Dictionary (Section 4.2.2) with input_string.
   * 5. If field_type is "item", let output be the result of running Parsing an Item (Section 4.2.3) with input_string.
   * 6. Discard any leading SP characters from input_string.
   * 7. If input_string is not empty, fail parsing.
   * 8. Otherwise, return output.
   */

  fieldValue = trimStart(fieldValue);

  const parse = getParser(fieldType);
  const parsed = parse(fieldValue);

  if (trimStart(parsed.rest)) throw SyntaxError(message(fieldValue, fieldType));

  return parsed.output;
}

export function getParser(fieldType: `${FieldType}`) {
  switch (fieldType) {
    case Type.Dictionary: {
      return parseDictionary;
    }
    case Type.Item: {
      return parseItem;
    }
    case Type.List: {
      return parseList;
    }

    default: {
      throw SyntaxError(Msg.Unreachable);
    }
  }
}

/** Parse string into {@link List}. */
export function parseList(input: string): Parsed<List> {
  /** Specification:
   * 1. Let members be an empty array.
   * 2. While input_string is not empty:
   *  1. Append the result of running Parsing an Item or Inner List (Section 4.2.1.1) with input_string to members.
   *  2. Discard any leading OWS characters from input_string.
   *  3. If input_string is empty, return members.
   *  4. Consume the first character of input_string; if it is not ",", fail parsing.
   *  5. Discard any leading OWS characters from input_string.
   *  6. If input_string is empty, there is a trailing comma; fail parsing.
   * 3. No structured data has been found; return members (which is empty).
   */

  const scanner = new Scanner(input);
  const members: (Item | InnerList)[] = [];
  const msg = message.bind(null, input, Type.List);

  while (scanner.current) {
    const parsedItemOrInnerList = parseItemOrInnerList(scanner.current);

    members.push(parsedItemOrInnerList.output);
    scanner.current = parsedItemOrInnerList.rest.trimStart();

    if (!scanner.current) {
      return {
        rest: scanner.current,
        output: { type: Type.List, value: members },
      };
    }

    const first = scanner.next();

    if (first !== Char.Comma) {
      throw new SyntaxError(msg());
    }

    scanner.current = scanner.current.trimStart();

    if (!scanner.current || scanner.current.endsWith(Char.Comma)) {
      throw new SyntaxError(msg());
    }
  }

  return {
    rest: scanner.current,
    output: { type: Type.List, value: [] },
  };
}

/** Parse string into {@link Item}. */
export function parseItem(input: string): Parsed<Item> {
  /** Specification:
   * 1. Let bare_item be the result of running Parsing a Bare Item (Section 4.2.3.1) with input_string.
   * 2. Let parameters be the result of running Parsing Parameters (Section 4.2.3.2) with input_string.
   * 3. Return the tuple (bare_item, parameters).
   */

  const parsedBareItem = parseBareItem(input);

  input = parsedBareItem.rest;

  const parsedParameters = parseParameters(input);

  return {
    rest: parsedParameters.rest,
    output: {
      type: Type.Item,
      value: [parsedBareItem.output, parsedParameters.output],
    },
  };
}

/** Parse string into {@link Item} or {@link InnerList}. */
export function parseItemOrInnerList(
  input: string,
): Parsed<Item | InnerList> {
  /**
   * 1. If the first character of input_string is "(", return the result of running Parsing an Inner List (Section 4.2.1.2) with input_string.
   * 2. Return the result of running Parsing an Item (Section 4.2.3) with input_string.
   */
  if (input[0] === Char.LParen) {
    return parseInnerList(input);
  }

  return parseItem(input);
}

/** Parse string into {@link Dictionary}. */
export function parseDictionary(input: string): Parsed<Dictionary> {
  /** Specification:
   * 1. Let dictionary be an empty, ordered map.
   * 2. While input_string is not empty:
   *  1. Let this_key be the result of running Parsing a Key (Section 4.2.3.3) with input_string.
   *  2. If the first character of input_string is "=":
   *    1. Consume the first character of input_string.
   *    2. Let member be the result of running Parsing an Item or Inner List (Section 4.2.1.1) with input_string.
   *  3. Otherwise:
   *    1. Let value be Boolean true.
   *    2. Let parameters be the result of running Parsing Parameters (Section 4.2.3.2) with input_string.
   *    3. Let member be the tuple (value, parameters).
   *  4. If dictionary already contains a key this_key (comparing character for character), overwrite its value with member.
   *  5. Otherwise, append key this_key with value member to dictionary.
   *  6. Discard any leading OWS characters from input_string.
   *  7. If input_string is empty, return dictionary.
   *  8. Consume the first character of input_string; if it is not ",", fail parsing.
   *  9. Discard any leading OWS characters from input_string.
   *  10. If input_string is empty, there is a trailing comma; fail parsing.
   * 3. No structured data has been found; return dictionary (which is empty).
   */

  const dictionary = new Map<string, Item | InnerList>();
  const scanner = new Scanner(input);
  const msg = message.bind(null, input, Type.Dictionary);

  while (scanner.current) {
    const parsedKey = parseKey(scanner.current);

    scanner.current = parsedKey.rest;

    const key = parsedKey.output;

    if (scanner.first === Char.Eq) {
      scanner.next();

      const parsedItemOrInnerList = parseItemOrInnerList(scanner.current);

      scanner.current = parsedItemOrInnerList.rest;

      const member = parsedItemOrInnerList.output;

      dictionary.set(key, member);
    } else {
      const parsedParameters = parseParameters(scanner.current);

      scanner.current = parsedParameters.rest;

      dictionary.set(key, {
        type: Type.Item,
        value: [TRUE, parsedParameters.output],
      });
    }

    scanner.current = scanner.current.trimStart();

    if (!scanner.current) {
      return {
        rest: scanner.current,
        output: { type: Type.Dictionary, value: [...dictionary] },
      };
    }

    const first = scanner.next();

    if (first !== Char.Comma) throw SyntaxError(msg());

    scanner.current = scanner.current.trimStart();

    if (!scanner.current || scanner.current.endsWith(Char.Comma)) {
      throw SyntaxError(msg());
    }
  }

  return {
    rest: scanner.current,
    output: { type: Type.Dictionary, value: [...dictionary] },
  };
}

/** Parse string into {@link BareItem}. */
export function parseBareItem(input: string): Parsed<BareItem> {
  /** Specification:
   * 1. If the first character of input_string is a "-" or a DIGIT, return the result of running Parsing an Integer or Decimal (Section 4.2.4) with input_string.
   * 2. If the first character of input_string is a DQUOTE, return the result of running Parsing a String (Section 4.2.5) with input_string.
   * 3. If the first character of input_string is an ALPHA or "*", return the result of running Parsing a Token (Section 4.2.6) with input_string.
   * 4. If the first character of input_string is ":", return the result of running Parsing a Byte Sequence (Section 4.2.7) with input_string.
   * 5. If the first character of input_string is "?", return the result of running Parsing a Boolean (Section 4.2.8) with input_string.
   * 6. Otherwise, the item type is unrecognized; fail parsing.
   */
  const first = head(input);

  if (first === Char.DQuote) return parseString(input);
  if (first === Char.Colon) return parseBinary(input);
  if (first === Char.Question) return parseBoolean(input);
  if (Char.Hyphen === first || reDigit.test(first)) {
    return parseIntegerOrDecimal(input);
  }
  if (Char.Star === first || reALPHA.test(first)) return parseToken(input);

  throw SyntaxError(message(input, SubType.BareItem));
}

/** Parse string into {@link Token}. */
export function parseToken(input: string): Parsed<Token> {
  /** Specification:
   * 1. If the first character of input_string is not ALPHA or "*", fail parsing.
   * 2. Let output_string be an empty string.
   * 3. While input_string is not empty:
   *  1. If the first character of input_string is not in tchar, ":", or "/", return output_string.
   *  2. Let char be the result of consuming the first character of input_string.
   *  3. Append char to output_string.
   * 4. Return output_string.
   */
  const scanner = new Scanner(input);

  if (!(scanner.first === Char.Star || reALPHA.test(scanner.first))) {
    throw SyntaxError(message(Type.Token, input));
  }

  let output = "";

  while (scanner.current) {
    const first = scanner.first;

    if (
      !(Char.Colon === first || Char.Slash === first || reTchar.test(first))
    ) {
      return {
        output: { type: Type.Token, value: output },
        rest: scanner.current,
      };
    }

    const char = scanner.next();

    output += char;
  }

  return {
    output: { type: Type.Token, value: output },
    rest: scanner.current,
  };
}

/** Parse string into {@link String}. */
export function parseString(input: string): Parsed<String> {
  /** Specification:
   * 1. Let output_string be an empty string.
   * 2. If the first character of input_string is not DQUOTE, fail parsing.
   * 3. Discard the first character of input_string.
   * 4. While input_string is not empty:
   *  1. Let char be the result of consuming the first character of input_string.
   *  2. If char is a backslash ("\"):
   *    1. If input_string is now empty, fail parsing.
   *    2. Let next_char be the result of consuming the first character of input_string.
   *    3. If next_char is not DQUOTE or "\", fail parsing.
   *    4. Append next_char to output_string.
   *  3. Else, if char is DQUOTE, return output_string.
   *  4. Else, if char is in the range %x00-1f or %x7f-ff (i.e., it is not in VCHAR or SP), fail parsing.
   *  5. Else, append char to output_string.
   * 5. Reached the end of input_string without finding a closing DQUOTE; fail parsing.
   */
  const scanner = new Scanner(input);
  const first = scanner.next();
  const msg = message.bind(null, input, Type.String);

  if (first !== Char.DQuote) throw SyntaxError(msg());

  let outputString = "";

  while (scanner.current) {
    const char = scanner.next();

    if (char === Char.BackSlash) {
      if (!scanner.current) throw SyntaxError(msg());

      const nextChar = scanner.next();

      if (!(nextChar === Char.DQuote || nextChar === Char.BackSlash)) {
        throw SyntaxError(msg());
      }

      outputString += nextChar;
    } else if (char === Char.DQuote) {
      return {
        rest: scanner.current,
        output: { type: Type.String, value: outputString },
      };
    } else if (char !== Char.Space && !reVCHAR.test(char)) {
      throw new SyntaxError(msg());
    } else {
      outputString += char;
    }
  }

  throw new SyntaxError(msg());
}

/** Parse string into {@link Integer} or {@link Decimal}. */
export function parseIntegerOrDecimal(
  input: string,
): Parsed<Integer | Decimal> {
  /** Specification:
   * 1. Let type be "integer".
   * 2. Let sign be 1.
   * 3. Let input_number be an empty string.
   * 4. If the first character of input_string is "-", consume it and set sign to -1.
   * 5. If input_string is empty, there is an empty integer; fail parsing.
   * 6. If the first character of input_string is not a DIGIT, fail parsing.
   * 7. While input_string is not empty:
   *  1. Let char be the result of consuming the first character of input_string.
   *  2. If char is a DIGIT, append it to input_number.
   *  3. Else, if type is "integer" and char is ".":
   *    1. If input_number contains more than 12 characters, fail parsing.
   *    2. Otherwise, append char to input_number and set type to "decimal".
   *  4. Otherwise, prepend char to input_string, and exit the loop.
   *  5. If type is "integer" and input_number contains more than 15 characters, fail parsing.
   *  6. If type is "decimal" and input_number contains more than 16 characters, fail parsing.
   * 8. If type is "integer":
   *  1. Parse input_number as an integer and let output_number be the product of the result and sign.
   * 9. Otherwise:
   *  1. If the final character of input_number is ".", fail parsing.
   *  2. If the number of characters after "." in input_number is greater than three, fail parsing.
   *  3. Parse input_number as a decimal number and let output_number be the product of the result and sign.
   * 10. Return output_number.
   */

  let type: Type.Integer | Type.Decimal = Type.Integer;
  let input_number = "";

  const scanner = new Scanner(input);
  const isMinus = scanner.first === Char.Hyphen;
  const sign = isMinus ? Sign.Minus : Sign.Plus;
  const messenger = message.bind(null, input);

  if (isMinus) {
    scanner.next();
  }

  if (!scanner.current) {
    throw SyntaxError(messenger(Type.Integer + " | " + Type.Dictionary));
  }

  if (!reDigit.test(scanner.first)) {
    throw SyntaxError(messenger(Type.Integer + " | " + Type.Dictionary));
  }

  while (scanner.current) {
    const char = scanner.next();

    if (reDigit.test(char)) {
      input_number += char;
    } else if (type === Type.Integer && char === Char.Period) {
      if (NumberOfDigits.MaxIntegerPart < input_number.length) {
        throw SyntaxError(messenger(Type.Decimal));
      }

      input_number += char;
      type = Type.Decimal;
    } else {
      scanner.current = char + scanner.current;
      break;
    }

    if (
      type === Type.Integer && NumberOfDigits.MaxInteger < input_number.length
    ) {
      throw SyntaxError(messenger(Type.Integer));
    }

    if (
      type === Type.Decimal && NumberOfDigits.MaxDecimal < input_number.length
    ) {
      throw SyntaxError(messenger(Type.Decimal));
    }
  }

  if (type === Type.Integer) {
    const outputNumber = Number.parseInt(input_number) * sign;

    return {
      output: { type: Type.Integer, value: outputNumber },
      rest: scanner.current,
    };
  }

  if (input_number.endsWith(Char.Period)) {
    throw SyntaxError(messenger(Type.Integer + " | " + Type.Dictionary));
  }

  if (
    NumberOfDigits.MaxFractionPart < decimalPlaces(Number(input_number))
  ) {
    throw SyntaxError(messenger(Type.Dictionary));
  }

  const outputNumber = Number.parseFloat(input_number) * sign;

  return {
    rest: scanner.current,
    output: { type: Type.Decimal, value: outputNumber },
  };
}

export interface Parsed<T> {
  /** The rest input string. */
  readonly rest: string;
  readonly output: T;
}

/** Parse string into {@link Boolean}. */
export function parseBoolean(input: string): Parsed<Boolean> {
  /** Specification:
   * 1. If the first character of input_string is not "?", fail parsing.
   * 2. Discard the first character of input_string.
   * 3. If the first character of input_string matches "1", discard the first character, and return true.
   * 4. If the first character of input_string matches "0", discard the first character, and return false.
   * 5. No value has matched; fail parsing.
   */
  const scanner = new Scanner(input);
  const first = scanner.next();
  const msg = message.bind(null, input, Type.Boolean);

  if (first !== Char.Question) throw SyntaxError(msg());

  const nextChar = scanner.next();

  if (nextChar === Bool.True || nextChar === Bool.False) {
    const value = nextChar === Bool.False ? false : true;

    return { output: { type: Type.Boolean, value }, rest: scanner.current };
  }

  throw SyntaxError(msg());
}

/** Parse string into {@link Binary}. */
export function parseBinary(input: string): Parsed<Binary> {
  /** Specification:
   * 1. If the first character of input_string is not ":", fail parsing.
   * 2. Discard the first character of input_string.
   * 3. If there is not a ":" character before the end of input_string, fail parsing.
   * 4. Let b64_content be the result of consuming content of input_string up to but not including the first instance of the character ":".
   * 5. Consume the ":" character at the beginning of input_string.
   * 6. If b64_content contains a character not included in ALPHA, DIGIT, "+", "/", and "=", fail parsing.
   * 7. Let binary_content be the result of base64-decoding [RFC4648] b64_content, synthesizing padding if necessary (note the requirements about recipient behavior below). If base64 decoding fails, parsing fails.
   * 8. Return binary_content.
   */

  const scanner = new Scanner(input);
  const first = scanner.next();
  const msg = message.bind(null, input, Type.Binary);

  if (first !== Char.Colon) throw SyntaxError(msg());

  const result = divideBy(Char.Colon, scanner.current);

  if (!result) throw SyntaxError(msg());

  const [b64Content, rest] = result;

  if (!reBase64Alphabet.test(b64Content)) throw SyntaxError(msg());

  const binaryContent = decode(b64Content);

  return {
    rest,
    output: { type: Type.Binary, value: binaryContent },
  };
}

/** Parse string into string. */
export function parseKey(input: string): Parsed<string> {
  /** Specification:
   * 1. If the first character of input_string is not lcalpha or "*", fail parsing.
   * 2. Let output_string be an empty string.
   * 3. While input_string is not empty:
   *  1. If the first character of input_string is not one of lcalpha, DIGIT, "_", "-", ".", or "*", return output_string.
   *  2. Let char be the result of consuming the first character of input_string.
   *  3. Append char to output_string.
   * 4. Return output_string.
   */
  const first = head(input);
  const msg = message.bind(null, input, SubType.Key);
  let outputString = "";

  if (!(first === Char.Star || reLcalpha.test(first))) {
    throw SyntaxError(msg());
  }

  const scanner = new Scanner(input);

  while (scanner.current) {
    const first = scanner.first;
    if (
      !(Char.Hyphen === first || Char.Period === first || Char.Star === first ||
        Char.Underscore === first ||
        reLcalpha.test(first) || reDigit.test(first))
    ) {
      return { rest: scanner.current, output: outputString };
    }

    const char = scanner.next();
    outputString += char;
  }

  return { rest: scanner.current, output: outputString };
}

/** Parse string into {@link Parameters}. */
export function parseParameters(input: string): Parsed<Parameters> {
  /** Specification:
   * 1. Let parameters be an empty, ordered map.
   * 2. While input_string is not empty:
   *  1. If the first character of input_string is not ";", exit the loop.
   *  2. Consume the ";" character from the beginning of input_string.
   *  3. Discard any leading SP characters from input_string.
   *  4. Let param_key be the result of running Parsing a Key (Section 4.2.3.3) with input_string.
   *  5. Let param_value be Boolean true.
   *  6. If the first character of input_string is "=":
   *    1. Consume the "=" character at the beginning of input_string.
   *    2. Let param_value be the result of running Parsing a Bare Item (Section 4.2.3.1) with input_string.
   *  7. If parameters already contains a key param_key (comparing character for character), overwrite its value with param_value.
   *  8. Otherwise, append key param_key with value param_value to parameters.
   * 3. Return parameters.
   */

  const scanner = new Scanner(input);
  const parameters = new Map<string, BareItem>();

  while (scanner.current) {
    if (scanner.first !== Char.SemiColon) break;

    scanner.next();
    scanner.current = trimStart(scanner.current);

    const parsedKey = parseKey(scanner.current);

    scanner.current = parsedKey.rest;

    const paramValue = scanner.first as string === Char.Eq
      ? (() => {
        scanner.next();

        const parsed = parseBareItem(scanner.current);

        scanner.current = parsed.rest;

        return parsed.output;
      })()
      : TRUE;

    parameters.set(parsedKey.output, paramValue);
  }
  return {
    rest: scanner.current,
    output: { type: Type.Parameters, value: [...parameters] },
  };
}

/** Parse string into {@link InnerList}. */
export function parseInnerList(input: string): Parsed<InnerList> {
  /** Specification:
   * 1. Consume the first character of input_string; if it is not "(", fail parsing.
   * 2. Let inner_list be an empty array.
   * 3. While input_string is not empty:
   *  1. Discard any leading SP characters from input_string.
   *  2. If the first character of input_string is ")":
   *    1. Consume the first character of input_string.
   *    2. Let parameters be the result of running Parsing Parameters (Section 4.2.3.2) with input_string.
   *    3. Return the tuple (inner_list, parameters).
   *  3. Let item be the result of running Parsing an Item (Section 4.2.3) with input_string.
   *  4. Append item to inner_list.
   *  5. If the first character of input_string is not SP or ")", fail parsing.
   * 6. The end of the Inner List was not found; fail parsing.
   */

  const scanner = new Scanner(input);
  const first = scanner.next();
  const msg = message.bind(null, input, Type.InnerList);

  if (first !== Char.LParen) throw SyntaxError(msg());

  const innerLists: Item[] = [];

  while (scanner.current) {
    scanner.current = trimStart(scanner.current);

    if (scanner.first === Char.RParen) {
      scanner.next();

      const parsedParameters = parseParameters(scanner.current);

      return {
        output: {
          type: Type.InnerList,
          value: [innerLists, parsedParameters.output],
        },
        rest: parsedParameters.rest,
      };
    }

    const parsedItem = parseItem(scanner.current);

    scanner.current = parsedItem.rest;
    innerLists.push(parsedItem.output);

    if (scanner.first !== Char.Space && scanner.first !== Char.RParen) {
      throw SyntaxError(msg());
    }
  }

  throw SyntaxError(msg());
}

function message(actual: string, type: string): string {
  return `invalid <${type}> syntax. "${actual}"`;
}
