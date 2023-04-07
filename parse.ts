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
import { decode, head, isEmpty, last } from "./deps.ts";
import { decimalPlaces, divideBy, Scanner, trimStart } from "./utils.ts";
import { Bool, Char, Kind, Msg, NumberOfDigits, Sign } from "./constants.ts";
import {
  reALPHA,
  reBase64Alphabet,
  reDigit,
  reLcalpha,
  reTchar,
  reVCHAR,
} from "./abnf.ts";

export type FieldType = Kind.List | Kind.Item | Kind.Dictionary;

export function parseSfv(filedValue: string, fieldType: `${Kind.Item}`): Item;
export function parseSfv(filedValue: string, fieldType: `${Kind.List}`): List;
export function parseSfv(
  filedValue: string,
  fieldType: `${Kind.Dictionary}`,
): Dictionary;
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
    case Kind.Dictionary: {
      return parseDictionary;
    }
    case Kind.Item: {
      return parseItem;
    }
    case Kind.List: {
      return parseList;
    }

    default: {
      throw SyntaxError(Msg.Unreachable);
    }
  }
}

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
  const msg = message.bind(null, input, Kind.List);

  while (!isEmpty(scanner.current)) {
    const parsedItemOrInnerList = parseItemOrInnerList(scanner.current);

    members.push(parsedItemOrInnerList.output);
    scanner.current = parsedItemOrInnerList.rest.trimStart();

    if (isEmpty(scanner.current)) {
      return {
        rest: scanner.current,
        output: { kind: Kind.List, value: members },
      };
    }

    const first = scanner.next();

    if (first !== Char.Comma) {
      throw new SyntaxError(msg());
    }

    scanner.current = scanner.current.trimStart();

    if (isEmpty(scanner.current) || scanner.current.endsWith(Char.Comma)) {
      throw new SyntaxError(msg());
    }
  }

  return {
    rest: scanner.current,
    output: { kind: Kind.List, value: [] },
  };
}

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
      kind: Kind.Item,
      value: [parsedBareItem.output, parsedParameters.output],
    },
  };
}

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
  const msg = message.bind(null, input, Kind.Dictionary);

  while (!isEmpty(scanner.current)) {
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
        kind: Kind.Item,
        value: [
          { kind: Kind.Boolean, value: true },
          parsedParameters.output,
        ],
      });
    }

    scanner.current = scanner.current.trimStart();

    if (isEmpty(scanner.current)) {
      return {
        rest: scanner.current,
        output: { kind: Kind.Dictionary, value: [...dictionary] },
      };
    }

    const first = scanner.next();

    if (first !== Char.Comma) throw SyntaxError(msg());

    scanner.current = scanner.current.trimStart();

    if (isEmpty(scanner.current) || scanner.current.endsWith(Char.Comma)) {
      throw SyntaxError(msg());
    }
  }

  return {
    rest: scanner.current,
    output: { kind: Kind.Dictionary, value: [...dictionary] },
  };
}

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

  throw SyntaxError(message(input, "bare-item"));
}

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
    throw SyntaxError(message(Kind.Token, input));
  }

  let output = "";

  while (!isEmpty(scanner.current)) {
    const first = scanner.first;

    if (
      !(Char.Colon === first || Char.Slash === first || reTchar.test(first))
    ) {
      return {
        output: { kind: Kind.Token, value: output },
        rest: scanner.current,
      };
    }

    const char = scanner.next();

    output += char;
  }

  return {
    output: { kind: Kind.Token, value: output },
    rest: scanner.current,
  };
}

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
  const msg = message.bind(null, input, Kind.String);

  if (first !== Char.DQuote) throw SyntaxError(msg());

  let outputString = "";

  while (!isEmpty(scanner.current)) {
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
        output: { kind: Kind.String, value: outputString },
      };
    } else if (char !== Char.Space && !reVCHAR.test(char)) {
      throw new SyntaxError(msg());
    } else {
      outputString += char;
    }
  }

  throw new SyntaxError(msg());
}

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

  let type: Kind.Integer | Kind.Decimal = Kind.Integer;
  let input_number = "";

  const scanner = new Scanner(input);
  const isMinus = scanner.first === Char.Hyphen;
  const sign = isMinus ? Sign.Minus : Sign.Plus;
  const messenger = message.bind(null, input);

  if (isMinus) {
    scanner.next();
  }

  if (isEmpty(scanner.current)) {
    throw SyntaxError(messenger(Kind.Integer + " | " + Kind.Dictionary));
  }

  if (!reDigit.test(scanner.first)) {
    throw SyntaxError(messenger(Kind.Integer + " | " + Kind.Dictionary));
  }

  while (!isEmpty(scanner.current)) {
    const char = scanner.next();

    if (reDigit.test(char)) {
      input_number += char;
    } else if (type === Kind.Integer && char === Char.Period) {
      if (NumberOfDigits.MaxIntegerPart < input_number.length) {
        throw SyntaxError(messenger(Kind.Decimal));
      }

      input_number += char;
      type = Kind.Decimal;
    } else {
      scanner.current = char + scanner.current;
      break;
    }

    if (
      type === Kind.Integer && NumberOfDigits.MaxInteger < input_number.length
    ) {
      throw SyntaxError(messenger(Kind.Integer));
    }

    if (
      type === Kind.Decimal && NumberOfDigits.MaxDecimal < input_number.length
    ) {
      throw SyntaxError(messenger(Kind.Decimal));
    }
  }

  if (type === Kind.Integer) {
    const outputNumber = Number.parseInt(input_number) * sign;

    return {
      output: { kind: Kind.Integer, value: outputNumber },
      rest: scanner.current,
    };
  }

  if (last(input_number) === Char.Period) {
    throw SyntaxError(messenger(Kind.Integer + " | " + Kind.Dictionary));
  }

  if (
    NumberOfDigits.MaxFractionPart < decimalPlaces(Number(input_number))
  ) {
    throw SyntaxError(messenger(Kind.Dictionary));
  }

  const outputNumber = Number.parseFloat(input_number) * sign;

  return {
    rest: scanner.current,
    output: { kind: Kind.Decimal, value: outputNumber },
  };
}

export interface Parsed<T> {
  /** The rest input string. */
  readonly rest: string;
  readonly output: T;
}

/**
 * @param input Any string.
 */
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
  const msg = message.bind(null, input, Kind.Boolean);

  if (first !== Char.Question) throw SyntaxError(msg());

  const nextChar = scanner.next();

  if (nextChar === Bool.True || nextChar === Bool.False) {
    const value = nextChar === Bool.False ? false : true;

    return { output: { kind: Kind.Boolean, value }, rest: scanner.current };
  }

  throw SyntaxError(msg());
}

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
  const msg = message.bind(null, input, Kind.Binary);

  if (first !== Char.Colon) throw SyntaxError(msg());

  const result = divideBy(Char.Colon, scanner.current);

  if (!result) throw SyntaxError(msg());

  const [b64Content, rest] = result;

  if (!reBase64Alphabet.test(b64Content)) throw SyntaxError(msg());

  const binaryContent = decode(b64Content);

  return {
    rest,
    output: { kind: Kind.Binary, value: binaryContent },
  };
}

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
  const msg = message.bind(null, input, "key");
  let outputString = "";

  if (!(first === Char.Star || reLcalpha.test(first))) {
    throw SyntaxError(msg());
  }

  const scanner = new Scanner(input);

  while (!isEmpty(scanner.current)) {
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

const TRUE = { kind: Kind.Boolean, value: true } as const;

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

  while (!isEmpty(scanner.current)) {
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
    output: { kind: Kind.Parameters, value: [...parameters] },
  };
}

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
  const msg = message.bind(null, input, Kind.InnerList);

  if (first !== Char.LParen) throw SyntaxError(msg());

  const innerLists: Item[] = [];

  while (!isEmpty(scanner.current)) {
    scanner.current = trimStart(scanner.current);

    if (scanner.first === Char.RParen) {
      scanner.next();

      const parsedParameters = parseParameters(scanner.current);

      return {
        output: {
          kind: Kind.InnerList,
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

function message(actual: string, kind: string): string {
  return `invalid <${kind}> syntax. "${actual}"`;
}
