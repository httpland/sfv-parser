import type {
  BareItem,
  Dictionary,
  InnerList,
  Item,
  List,
  Parameters,
  Sfv,
} from "./types.ts";
import { isBoolean, isNumber, isString } from "./_dev_deps.ts";
import { decode } from "https://deno.land/std@0.182.0/encoding/base32.ts";

export interface Failure extends Suite {
  readonly header_type: "item" | "dictionary" | "list";
  /** indicating whether the test is required to fail. Defaults to false. */
  readonly must_fail: true;
}

export type Success = Suite & (ListHeader | ItemHeader | DictionaryHeader);

interface ItemHeader {
  readonly header_type: "item";

  /** The expected data structure after parsing (if successful). Required, unless must_fail is true. */
  readonly expected: Test.Item;
}

interface ListHeader {
  readonly header_type: "list";

  readonly expected: Test.List;
}

interface DictionaryHeader {
  readonly header_type: "dictionary";

  readonly expected: Test.Dictionary;
}

export interface Suite {
  /** A string describing the test. */
  readonly name: string;

  /** An array of strings, each representing a field value received. */
  readonly raw: string[];

  readonly header_type: string;

  /** indicating whether failing this test is acceptable; for SHOULDs.
   * @default false
   */
  readonly can_fail?: boolean;

  readonly expected?: unknown;

  /** An array of strings representing the canonical form of the field value, if it is different from raw. Not applicable if must_fail is true. */
  readonly canonical?: string[];
}

declare namespace Test {
  interface Token {
    readonly "__type": "token";

    readonly value: string;
  }

  interface Binary {
    readonly "__type": "binary";

    readonly value: string;
  }

  type BareItem = Token | Binary | string | number | boolean;

  type InnerList = [Item[], Parameters];

  type Item = [BareItem, Parameters];

  type List = (Item | InnerList)[];

  type Parameters = [string, BareItem][];

  type Dictionary = [string, Item | InnerList][];
}

// convert "expected" in test.json into JS Primitive
export function format(input: Test.BareItem): BareItem {
  if (isString(input)) {
    return { kind: "string", value: input };
  }

  if (isNumber(input)) {
    if (Number.isInteger(input)) {
      return { kind: "integer", value: input };
    }

    return { kind: "decimal", value: input };
  }

  if (isBoolean(input)) return { kind: "boolean", value: input };

  switch (input[`__type`]) {
    case "binary":
      return {
        kind: "binary",
        value: decode(input.value),
      };

    case "token":
      return { kind: "token", value: input.value };
    default:
      throw Error(`${input} ${typeof input} hogre`);
  }
}

export function convert(
  input: ItemHeader | ListHeader | DictionaryHeader,
): Sfv {
  switch (input.header_type) {
    case "item": {
      return formatItem(input.expected);
    }

    case "list": {
      return formatList(input.expected);
    }

    case "dictionary": {
      return formatDictionary(input.expected);
    }
  }
}

export function formatItem([value, params]: Test.Item): Item {
  const bareItem = format(value);
  const parameters = formatParams(params);

  return { kind: "item", value: [bareItem, parameters] };
}

export function formatList(expected: Test.List): List {
  return { kind: "list", value: expected.map(formatItemOrInnerList) };
}

export function formatDictionary(
  expected: Test.Dictionary,
): Dictionary {
  const dictionary = expected.map(([key, values]) => {
    const itemOrInnerList = formatItemOrInnerList(values);

    return [key, itemOrInnerList] as [string, Item | InnerList];
  });

  return { kind: "dictionary", value: dictionary };
}

function formatItemOrInnerList(
  itemOrInnerList: Test.InnerList | Test.Item,
): Item | InnerList {
  if (isInnerList(itemOrInnerList)) {
    return formatInnerList(itemOrInnerList);
  }

  return formatItem(itemOrInnerList);
}

function formatInnerList(innerList: Test.InnerList): InnerList {
  const items = innerList[0].map(formatItem);
  const parameters = formatParams(innerList[1]);

  return { kind: "inner-list", value: [items, parameters] };
}

function isInnerList(
  itemOrList: Test.Item | Test.InnerList,
): itemOrList is Test.InnerList {
  return (itemOrList as Test.InnerList).every(Array.isArray);
}

function formatParams(params: Test.Parameters): Parameters {
  return {
    kind: "parameters",
    value: params.map(([key, value]) => [key, format(value)]),
  };
}
