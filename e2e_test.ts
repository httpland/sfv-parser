import { convert, headerType, pascalCase } from "./_suite.ts";

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
import serializationTokenGenerated from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/serialisation-tests/token-generated.json" assert {
  type: "json",
};
import serializationStringGenerated from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/serialisation-tests/string-generated.json" assert {
  type: "json",
};
import serializationNumber from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/serialisation-tests/number.json" assert {
  type: "json",
};
import serializationKeyGenerated from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/serialisation-tests/key-generated.json" assert {
  type: "json",
};

import { assertEquals, assertThrows, describe, it } from "./_dev_deps.ts";
import { parseSfv } from "./parse.ts";
import { stringifySfv } from "./stringify.ts";

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

// Decimals what is 0 padding become integers when they become JavaScript objects.
const ignoreNames = [
  "fractional 0 decimal",
  "missing parameter value parameterised list",
  "missing terminal parameter value parameterised list",
  "single item parameterised list",
  "single item parameterised dict",
  "list item parameterised dictionary",
];

describe("parsing", () => {
  suites.forEach((suite) => {
    const ignore = ignoreNames.some((v) => suite.name.includes(v));

    it(suite.name, { ignore }, () => {
      const fieldValue = suite.raw.join();

      if (
        "expected" in suite && "raw" in suite && headerType(suite.header_type)
      ) {
        const result = parseSfv(fieldValue, pascalCase(suite.header_type));
        const expected = convert(suite as never);
        assertEquals(result, expected);
      } else {
        assertThrows(() =>
          parseSfv(fieldValue, pascalCase(suite.header_type as never))
        );
      }
    });
  });
});

const serializationSuites = [
  serializationTokenGenerated,
  serializationStringGenerated,
  serializationNumber,
  serializationKeyGenerated,
  ...suites,
].flat();

describe("serialization", () => {
  serializationSuites.forEach((suite) => {
    const ignore = ignoreNames.some((v) => suite.name.includes(v));
    it(suite.name, { ignore }, () => {
      if (!suite.expected) return;

      // deno-lint-ignore no-explicit-any
      const sfv = convert(suite as any);

      if (("must_fail" in suite && suite.must_fail)) {
        assertThrows(() => stringifySfv(sfv));
      } else if ("canonical" in suite && Array.isArray(suite.canonical)) {
        const expected = suite.canonical.join("");

        if ("can_fail" in suite) {
          try {
            assertEquals(stringifySfv(sfv), expected);
          } catch {
            // noop
          }
        } else {
          assertEquals(stringifySfv(sfv), expected);
        }
      }
    });
  });
});
