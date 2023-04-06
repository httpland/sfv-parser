import { convert, Failure, Success } from "./_suite.ts";
import token from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/token.json" assert {
  type: "json",
};
import tokenGenerated from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/token-generated.json" assert {
  type: "json",
};
import number from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/number.json" assert {
  type: "json",
};
import numberGenerated from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/number-generated.json" assert {
  type: "json",
};

import string from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/string.json" assert {
  type: "json",
};
import stringGenerated from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/string-generated.json" assert {
  type: "json",
};
import boolean from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/boolean.json" assert {
  type: "json",
};
import binary from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/binary.json" assert {
  type: "json",
};
import list from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/list.json" assert {
  type: "json",
};
import listlist from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/listlist.json" assert {
  type: "json",
};
import item from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/item.json" assert {
  type: "json",
};
import dictionary from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/dictionary.json" assert {
  type: "json",
};
import paramListlist from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/param-listlist.json" assert {
  type: "json",
};
import paramList from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/param-list.json" assert {
  type: "json",
};
import paramDict from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/param-dict.json" assert {
  type: "json",
};
import largeGenerated from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/large-generated.json" assert {
  type: "json",
};
import keyGenerated from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/key-generated.json" assert {
  type: "json",
};
import examples from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/examples.json" assert {
  type: "json",
};
import { partition } from "https://deno.land/std@0.182.0/collections/partition.ts";
import { assertEquals, assertThrows, describe, it } from "./_dev_deps.ts";
import { parseSfv } from "./parse.ts";

const suites = [
  token,
  tokenGenerated,
  string,
  stringGenerated,
  number,
  numberGenerated,
  boolean,
  binary,
  list,
  listlist,
  item,
  dictionary,
  paramList,
  paramDict,
  paramListlist,
  largeGenerated,
  keyGenerated,
  examples,
].flat();

const [success, failure] = partition(
  suites,
  (suite) => "expected" in suite,
) as unknown as [Success[], Failure[]];

const ignoreNames = [
  "fractional 0 decimal",
  "missing parameter value parameterised list",
  "missing terminal parameter value parameterised list",
  "single item parameterised list",
  "single item parameterised dict",
  "list item parameterised dictionary",
];

describe("success test case", () => {
  success.forEach((suite) => {
    // Decimals what is 0 padding become integers when they become JavaScript objects.

    const ignore = ignoreNames.some((v) => suite.name.includes(v));

    it(suite.name, { ignore: ignore }, () => {
      const result = parseSfv(suite.raw.join(), suite.header_type);
      const expected = convert(suite);

      assertEquals(result, expected);
    });
  });
});

describe("failure test case", () => {
  failure.forEach((suite) => {
    it(suite.name, () => {
      assertThrows(() => parseSfv(suite.raw.join(), suite.header_type));
    });
  });
});
