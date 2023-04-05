import type {
  BareItem,
  ByteSequence,
  Decimal,
  Dictionary,
  InnerList,
  Integer,
  Item,
  List,
  Parameters,
  String,
  Token,
} from "./types.ts";
import { decode, isEmpty } from "./deps.ts";
import { divideBy, divideOf, last, Scanner } from "./utils.ts";

type Sfv = Dictionary | Item | List;

export function parseSfv(fieldValue: string, fieldType: `${FieldType}`): Sfv {
  fieldValue = fieldValue.trimStart();

  const parser = getParser(fieldType);
  const parsed = parser(fieldType);

  if (!parsed.rest.trimStart()) throw SyntaxError();

  return parsed.output;
}

function getParser(fieldType: `${FieldType}`) {
  switch (fieldType) {
    case FieldType.Dictionary: {
      return parseDictionary;
    }
    case FieldType.Item: {
      return parseItem;
    }
    case FieldType.List: {
      return parseList;
    }

    default: {
      throw Error();
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

  while (!isEmpty(scanner.current)) {
    const parsedItemOrInnerList = parseItemOrInnerList(scanner.current);

    members.push(parsedItemOrInnerList.output);
    scanner.current = parsedItemOrInnerList.rest.trimStart();

    if (isEmpty(scanner.current)) {
      return { rest: scanner.current, output: members };
    }

    const first = scanner.next();

    if (first !== ",") {
      throw new Error(`failed to parse ${input} as List`);
    }

    scanner.current = scanner.current.trimStart();

    if (isEmpty(scanner.current) || scanner.current.endsWith(",")) {
      throw new Error(`failed to parse ${input} as List`);
    }
  }

  return {
    rest: scanner.current,
    output: [],
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
    output: [parsedBareItem.output, parsedParameters.output],
  };
}

export function parseItemOrInnerList(
  input: string,
): Parsed<Item | InnerList> {
  /**
   * 1. If the first character of input_string is "(", return the result of running Parsing an Inner List (Section 4.2.1.2) with input_string.
   * 2. Return the result of running Parsing an Item (Section 4.2.3) with input_string.
   */
  if (input[0] === "(") {
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

  while (!isEmpty(scanner.current)) {
    const parsedKey = parseKey(scanner.current);

    scanner.current = parsedKey.rest;

    const this_key = parsedKey.output;

    if (scanner.first === "=") {
      scanner.next();

      const parsedItemOrInnerList = parseItemOrInnerList(scanner.current);

      scanner.current = parsedItemOrInnerList.rest;

      const member = parsedItemOrInnerList.output;

      dictionary.set(this_key, member);
    } else {
      const parsedParameters = parseParameters(scanner.current);

      scanner.current = parsedParameters.rest;

      dictionary.set(this_key, [true, parsedParameters.output]);
    }

    scanner.current = scanner.current.trimStart();

    if (isEmpty(scanner.current)) {
      return { rest: scanner.current, output: Object.fromEntries(dictionary) };
    }

    const first = scanner.next();
    if (first !== ",") {
      throw new Error(`failed to parse ${input} as Dictionary`);
    }

    scanner.current = scanner.current.trimStart();

    if (isEmpty(scanner.current) || scanner.current.endsWith(",")) {
      throw new Error(`failed to parse ${input} as Dictionary`);
    }
  }

  return {
    rest: scanner.current,
    output: Object.fromEntries(dictionary),
  };
}

export function parseBareItem(input: string): Parsed<BareItem> {
  const first = input[0];

  if (first === `"`) return parseString(input);
  if (first === `:`) return parseByteSequence(input);
  if (first === `?`) return parseBoolean(input);
  if (/^[\d-]$/.test(first)) return parseIntegerOrDecimal(input);
  if (/^[A-Za-z*]$/.test(first)) return parseToken(input);

  throw SyntaxError();
}

export function parseToken(input: string): Parsed<Token> {
  if (!/^[a-zA-Z*]$/.test(input[0])) {
    throw new SyntaxError(`failed to parse ${input} as Token`);
  }

  const re = /^([!#$%&'*+.^_`|~\w:/-]+)/g;
  const output = re.exec(input)?.[1] ?? "";
  const rest = input.substring(re.lastIndex);

  return {
    output: { kind: "token", value: output },
    rest,
  };
}

const enum Char {
  DQuote = `"`,
  BackSlash = "\\",
}

export function parseString(input: string): Parsed<String> {
  const scanner = new Scanner(input);
  const first = scanner.next();

  if (first !== Char.DQuote) {
    throw new Error(`failed to parse ${input} as String`);
  }

  let outputString = "";

  while (!isEmpty(scanner.current)) {
    const char = scanner.next();

    if (char === Char.BackSlash) {
      if (!scanner.current) throw SyntaxError();

      const nextChar = scanner.next();

      if (!(nextChar === Char.DQuote || nextChar === Char.BackSlash)) {
        throw SyntaxError();
      }

      outputString += nextChar;
    } else if (char === Char.DQuote) {
      return {
        rest: scanner.current,
        output: { kind: "string", value: outputString },
      };
    } else if (/^[\x00-\x1f\x7f-\xff]$/.test(char)) {
      throw new Error(`failed to parse ${input} as String`);
    } else {
      outputString += char;
    }
  }

  throw new Error(`failed to parse ${input} as String`);
}

export function parseIntegerOrDecimal(
  input: string,
): Parsed<Integer | Decimal> {
  let type: "integer" | "decimal" = "integer";
  let input_number = "";

  const scanner = new Scanner(input);
  const isMinus = scanner.first === "-";
  const sign = isMinus ? -1 : 1;

  if (isMinus) {
    scanner.next();
  }

  if (isEmpty(scanner.current)) throw SyntaxError();

  const re_integer = /^\d$/;

  if (!re_integer.test(scanner.first)) throw SyntaxError();

  while (!isEmpty(scanner.current)) {
    const char = scanner.next();

    if (re_integer.test(char)) {
      input_number += char;
    } else if (type === "integer" && char === ".") {
      if (12 < input_number.length) throw SyntaxError();

      input_number += char;
      type = "decimal";
    } else {
      scanner.current = char + scanner.current;
      break;
    }

    if (type === "integer" && 15 < input_number.length) {
      throw SyntaxError();
    }

    if (type === "decimal" && 16 < input_number.length) throw SyntaxError();
  }

  if (type === "integer") {
    const outputNumber = Number.parseInt(input_number) * sign;

    return {
      output: { kind: "integer", value: outputNumber },
      rest: scanner.current,
    };
  }

  if (last(input_number) === ".") throw SyntaxError();

  if (3 < ((divideBy(".", input_number)?.[1])?.length ?? 0)) {
    throw SyntaxError();
  }

  const outputNumber = Number.parseFloat(input_number) * sign;

  return {
    rest: scanner.current,
    output: { kind: "decimal", value: outputNumber },
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
export function parseBoolean(input: string): Parsed<boolean> {
  const [first, tail] = divideOf(1, input);

  if (first !== "?") throw SyntaxError();

  const [target, rest] = divideOf(1, tail);

  if (target === "1" || target === "0") {
    return { output: Boolean(Number(target)), rest };
  }

  throw SyntaxError();
}

const base64Alphabet = /^[A-Za-z\d+/=]*$/;

export function parseByteSequence(input: string): Parsed<ByteSequence> {
  const scanner = new Scanner(input);

  const first = scanner.next();

  if (first !== ":") throw SyntaxError();

  const result = divideBy(":", scanner.current);

  if (!result) throw SyntaxError();

  const [b64Content, rest] = result;

  if (!base64Alphabet.test(b64Content)) {
    throw new Error("Parsing failed: input string contains invalid characters");
  }

  const binaryContent = decode(b64Content);

  return {
    rest,
    output: {
      kind: "byte-sequence",
      value: binaryContent,
    },
  };
}

const Relcalpha = /^[a-z]$/;
const ReKey = /^[a-z\d_.*-]*$/;

export function parseKey(input: string): Parsed<string> {
  const first = input[0];
  let outputString = "";

  if (!(first === "*" || Relcalpha.test(first))) throw SyntaxError();

  const scanner = new Scanner(input);

  while (!isEmpty(scanner.current)) {
    if (!ReKey.test(scanner.first)) {
      return { rest: scanner.current, output: outputString };
    }

    const char = scanner.next();
    outputString += char;
  }

  return {
    rest: scanner.current,
    output: outputString,
  };
}

/**
 * @returns
 */
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
    if (scanner.first !== ";") break;

    scanner.next();
    scanner.current = scanner.current.trimStart();

    const parsedKey = parseKey(scanner.current);

    scanner.current = parsedKey.rest;

    const paramValue = scanner.first as string === "="
      ? (() => {
        scanner.next();

        const parsed = parseBareItem(scanner.current);

        scanner.current = parsed.rest;

        return parsed.output;
      })()
      : true;

    parameters.set(parsedKey.output, paramValue);
  }
  return {
    rest: scanner.current,
    output: Object.fromEntries(parameters),
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

  if (first !== "(") throw SyntaxError();

  const inner_list: Item[] = [];
  while (!isEmpty(scanner.current)) {
    scanner.current = scanner.current.trimStart();

    if (scanner.first === ")") {
      scanner.next();

      const parsedParameters = parseParameters(scanner.current);

      return {
        output: [inner_list, parsedParameters.output],
        rest: parsedParameters.rest,
      };
    }

    const parsedItem = parseItem(scanner.current);

    scanner.current = parsedItem.rest;
    inner_list.push(parsedItem.output);

    if (scanner.first !== " " && scanner.first !== ")") throw SyntaxError();
  }

  throw SyntaxError(`failed to parse ${input} as Inner List`);
}

const enum FieldType {
  Dictionary = "dictionary",
  List = "list",
  Item = "item",
}
