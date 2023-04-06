import {
  parseBareItem,
  parseBinary,
  parseBoolean,
  Parsed,
  parseDictionary,
  parseInnerList,
  parseIntegerOrDecimal,
  parseItem,
  parseKey,
  parseList,
  parseParameters,
  parseString,
  parseToken,
} from "./parse.ts";
import {
  BareItem,
  Dictionary,
  InnerList,
  Item,
  List,
  Parameters,
} from "./types.ts";
import { assertEquals, assertThrows, describe, it } from "./_dev_deps.ts";

describe("parseBoolean", () => {
  it("should return parsed boolean if the input string is valid", () => {
    const table: [string, Parsed<boolean>][] = [
      ["?1", { rest: "", output: true }],
      ["?0", { rest: "", output: false }],
      ["?0   ", { rest: "   ", output: false }],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(parseBoolean(input), {
        ...expected,
        output: { kind: "boolean", value: expected.output },
      });
    });
  });

  it("should throw error if the input string is invalid", () => {
    const table: string[] = [
      "",
      " ?",
      "? ",
      "?2",
      "?-0",
      "?-",
    ];

    table.forEach((input) => {
      assertThrows(() => parseBoolean(input));
    });
  });
});

describe("parseToken", () => {
  it("should return parsed token if the input string is valid", () => {
    const table: [string, Parsed<string>][] = [
      ["*", { rest: "", output: "*" }],
      ["a", { rest: "", output: "a" }],
      ["abc", { rest: "", output: "abc" }],
      ["abc ", { rest: " ", output: "abc" }],
      ["abc def", { rest: " def", output: "abc" }],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(parseToken(input), {
        rest: expected.rest,
        output: { kind: "token", value: expected.output },
      });
    });
  });

  it("should throw error if the input string is invalid", () => {
    const table: string[] = [
      "",
      "0",
      " ?",
      "? ",
      "?2",
      "?-0",
      "?-",
    ];

    table.forEach((input) => {
      assertThrows(() => parseToken(input));
    });
  });
});

describe("parseString", () => {
  it("should return parsed string if the input string is valid", () => {
    const table: [string, Parsed<string>][] = [
      [`""`, { rest: "", output: "" }],
      [`"a"`, { rest: "", output: "a" }],
      [`"abc"`, { rest: "", output: "abc" }],
      [`"abc" `, { rest: " ", output: "abc" }],
      [`"abc"`, { rest: "", output: "abc" }],
      [`"\\""`, { rest: "", output: `"` }],
      [`"\\\\"`, { rest: ``, output: `\\` }],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(parseString(input), {
        rest: expected.rest,
        output: { kind: "string", value: expected.output },
      });
    });
  });

  it("should throw error if the input string is invalid", () => {
    const table: string[] = [
      "",
      "''",
      ` ""`,
      `"?`,
      `"\x00"`,
      `"\t"`,
      `"\\`,
      `"\\'"`,
      `"\\?`,
    ];

    table.forEach((input) => {
      assertThrows(() => parseString(input));
    });
  });
});

describe("parseIntegerOrDecimal", () => {
  it("should return parsed integer if the input string is valid integer", () => {
    const table: [string, Parsed<number>][] = [
      ["0", { rest: "", output: 0 }],
      ["10", { rest: "", output: 10 }],
      ["-10", { rest: "", output: -10 }],
      ["-0", { rest: "", output: 0 }],
      ["0 ", { rest: " ", output: 0 }],
      ["0abcd", { rest: "abcd", output: 0 }],
      ["999999999999999", { rest: "", output: 999999999999999 }],
      ["-999999999999999", { rest: "", output: -999999999999999 }],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(parseIntegerOrDecimal(input), {
        rest: expected.rest,
        output: { kind: "integer", value: expected.output },
      });
    });
  });

  it("should return parsed decimal if the input string is valid decimal", () => {
    const table: [string, Parsed<number>][] = [
      ["1.1", { rest: "", output: 1.1 }],
      ["-1.1", { rest: "", output: -1.1 }],
      ["0.0", { rest: "", output: 0 }],
      ["-0.0", { rest: "", output: 0 }],
      ["000.0", { rest: "", output: 0 }],
      ["0.0 ", { rest: " ", output: 0 }],
      ["0.0abc", { rest: "abc", output: 0 }],
      ["100.123", { rest: "", output: 100.123 }],
      ["100000000000.000", { rest: "", output: 100000000000 }],
      ["-100000000000.000", { rest: "", output: -100000000000 }],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(parseIntegerOrDecimal(input), {
        rest: expected.rest,
        output: { kind: "decimal", value: expected.output },
      });
    });
  });

  it("should throw error if the input string is invalid", () => {
    const table: string[] = [
      "",
      "a",
      "0000000000000000",
      "-0000000000000000",
      "-0000000000000000",
      "1000000000000.0",
      "100000000000.0000",
      "0.",
      "0.1234",
      " 0",
      "NaN",
    ];

    table.forEach((input) => {
      assertThrows(() => parseIntegerOrDecimal(input));
    });
  });
});

describe("parseByteSequence", () => {
  it("should return parsed byte sequence if the input string is valid", () => {
    const table: [string, Parsed<Uint8Array>][] = [
      ["::", { rest: "", output: new Uint8Array() }],
      ["::abc", { rest: "abc", output: new Uint8Array() }],
      [":cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==:abc", {
        rest: "abc",
        output: Uint8Array.from([
          112,
          114,
          101,
          116,
          101,
          110,
          100,
          32,
          116,
          104,
          105,
          115,
          32,
          105,
          115,
          32,
          98,
          105,
          110,
          97,
          114,
          121,
          32,
          99,
          111,
          110,
          116,
          101,
          110,
          116,
          46,
        ]),
      }],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(parseBinary(input), {
        rest: expected.rest,
        output: { kind: "binary", value: expected.output },
      });
    });
  });

  it("should throw error if the input string is invalid", () => {
    const table: string[] = [
      "",
      ":",
      " ::",
      ":?:",
      ": :",
      ";a;",
    ];

    table.forEach((input) => {
      assertThrows(() => parseBinary(input));
    });
  });
});

describe("parseBareItem", () => {
  it("should return parsed bare item if the input string is valid", () => {
    const table: [string, Parsed<BareItem>][] = [
      [`"a"...`, { rest: "...", output: { kind: "string", value: "a" } }],
      [`100 ...`, { rest: " ...", output: { kind: "integer", value: 100 } }],
      [`100.1 ...`, {
        rest: " ...",
        output: { kind: "decimal", value: 100.1 },
      }],
      [`?0...`, {
        rest: "...",
        output: { kind: "boolean", value: false },
      }],
      [`a ...`, {
        rest: " ...",
        output: { kind: "token", value: "a" },
      }],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(parseBareItem(input), expected);
    });
  });

  it("should throw error if the input string is invalid", () => {
    const table: string[] = [
      "",
      ":",
      `"`,
      " ",
    ];

    table.forEach((input) => {
      assertThrows(() => parseBareItem(input));
    });
  });
});

describe("parseKey", () => {
  it("should return parsed key if the input string is valid", () => {
    const table: [string, Parsed<string>][] = [
      ["aa", { rest: "", output: "aa" }],
      ["*", { rest: "", output: "*" }],
      ["*?", { rest: "?", output: "*" }],
      ["abc def", { rest: " def", output: "abc" }],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(parseKey(input), expected);
    });
  });

  it("should throw error if the input string is invalid", () => {
    const table: string[] = [
      "",
      ":",
      `"`,
      " ",
    ];

    table.forEach((input) => {
      assertThrows(() => parseKey(input));
    });
  });
});

const parameters = { kind: "parameters", value: [] } as const;

describe("parseParameters", () => {
  it("should return parsed parameters if the input string is valid", () => {
    const table: [string, Parsed<Parameters>][] = [
      ["", { rest: "", output: parameters }],
      ["a", { rest: "a", output: parameters }],
      ["abc", { rest: "abc", output: parameters }],
      [";a", {
        rest: "",
        output: {
          kind: "parameters",
          value: [["a", { kind: "boolean", value: true }]],
        },
      }],
      ["; a", {
        rest: "",
        output: {
          kind: "parameters",
          value: [["a", { kind: "boolean", value: true }]],
        },
      }],
      [";a =", {
        rest: " =",
        output: {
          kind: "parameters",
          value: [["a", { kind: "boolean", value: true }]],
        },
      }],
      [";a?", {
        rest: "?",
        output: {
          kind: "parameters",
          value: [["a", { kind: "boolean", value: true }]],
        },
      }],
      ["; a=?0", {
        rest: "",
        output: {
          kind: "parameters",
          value: [["a", { kind: "boolean", value: false }]],
        },
      }],
      [";*=?0", {
        rest: "",
        output: {
          kind: "parameters",
          value: [["*", { kind: "boolean", value: false }]],
        },
      }],
      [";*=?1", {
        rest: "",
        output: {
          kind: "parameters",
          value: [["*", { kind: "boolean", value: true }]],
        },
      }],
      [";*=1-", {
        rest: "-",
        output: {
          kind: "parameters",
          value: [["*", { kind: "integer", value: 1 }]],
        },
      }],
      [";*=100", {
        rest: "",
        output: {
          kind: "parameters",
          value: [["*", { kind: "integer", value: 100 }]],
        },
      }],
      [";*=100.0 ", {
        rest: " ",
        output: {
          kind: "parameters",
          value: [["*", { kind: "decimal", value: 100 }]],
        },
      }],
      [`;*="abc"`, {
        rest: "",
        output: {
          kind: "parameters",
          value: [["*", { kind: "string", value: "abc" }]],
        },
      }],
      [`;a="abc"; b=::; c=abc`, {
        rest: "",
        output: {
          kind: "parameters",
          value: [
            ["a", { kind: "string", value: "abc" }],
            ["b", { kind: "binary", value: new Uint8Array() }],
            ["c", { kind: "token", value: "abc" }],
          ],
        },
      }],
      [` ;a="abc"; b=::; c=abc`, {
        rest: ` ;a="abc"; b=::; c=abc`,
        output: parameters,
      }],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(parseParameters(input), expected);
    });
  });

  it("should throw error if the input string is invalid", () => {
    const table: string[] = [
      ";?",
      ";a=?",
      ";;",
      "; ",
    ];

    table.forEach((input) => {
      assertThrows(() => parseParameters(input));
    });
  });
});

describe("parseItem", () => {
  it("should return parsed item if the input string is valid", () => {
    const table: [string, Parsed<Item>][] = [
      ["1", {
        rest: "",
        output: {
          kind: "item",
          value: [{ kind: "integer", value: 1 }, parameters],
        },
      }],
      ["1.0a", {
        rest: "a",
        output: {
          kind: "item",
          value: [{ kind: "decimal", value: 1 }, parameters],
        },
      }],
      ["1.0 ;", {
        rest: " ;",
        output: {
          kind: "item",
          value: [{ kind: "decimal", value: 1 }, parameters],
        },
      }],
      ["1.0;a", {
        rest: "",
        output: {
          kind: "item",
          value: [
            { kind: "decimal", value: 1 },
            {
              kind: "parameters",
              value: [["a", { kind: "boolean", value: true }]],
            },
          ],
        },
      }],
      ["a;a=?0", {
        rest: "",
        output: {
          kind: "item",
          value: [
            { kind: "token", value: "a" },
            {
              kind: "parameters",
              value: [["a", { kind: "boolean", value: false }]],
            },
          ],
        },
      }],
      [`a;*=?1; a="test" ;b`, {
        rest: " ;b",
        output: {
          kind: "item",
          value: [
            { kind: "token", value: "a" },
            {
              kind: "parameters",
              value: [
                ["*", { kind: "boolean", value: true }],
                ["a", { kind: "string", value: "test" }],
              ],
            },
          ],
        },
      }],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(parseItem(input), expected);
    });
  });

  it("should throw error if the input string is invalid", () => {
    const table: string[] = [
      "",
      " ",
      "a;???=",
    ];

    table.forEach((input) => {
      assertThrows(() => parseItem(input));
    });
  });
});

describe("parseInnerList", () => {
  it("should return parsed inner list if the input string is valid", () => {
    const table: [string, Parsed<InnerList>][] = [
      ["()", {
        rest: "",
        output: { kind: "inner-list", value: [[], parameters] },
      }],
      ["( )", {
        rest: "",
        output: { kind: "inner-list", value: [[], parameters] },
      }],
      ["()abc", {
        rest: "abc",
        output: { kind: "inner-list", value: [[], parameters] },
      }],
      ["(a)", {
        rest: "",
        output: {
          kind: "inner-list",
          value: [
            [{
              kind: "item",
              value: [{ kind: "token", value: "a" }, parameters],
            }],
            parameters,
          ],
        },
      }],

      ["(1.0 1)", {
        rest: "",
        output: {
          kind: "inner-list",
          value: [
            [
              {
                kind: "item",
                value: [{ kind: "decimal", value: 1 }, parameters],
              },
              {
                kind: "item",
                value: [{ kind: "integer", value: 1 }, parameters],
              },
            ],
            parameters,
          ],
        },
      }],
      [`( 1.1 1  "a")...`, {
        rest: "...",
        output: {
          kind: "inner-list",
          value: [[
            {
              kind: "item",
              value: [{ kind: "decimal", value: 1.1 }, parameters],
            },
            {
              kind: "item",
              value: [{ kind: "integer", value: 1 }, parameters],
            },
            {
              kind: "item",
              value: [{ kind: "string", value: "a" }, parameters],
            },
          ], parameters],
        },
      }],
      [`( 1.1; a; b=b 1  "a" )...`, {
        rest: "...",
        output: {
          kind: "inner-list",
          value: [[
            {
              kind: "item",
              value: [
                { kind: "decimal", value: 1.1 },
                {
                  kind: "parameters",
                  value: [
                    ["a", { kind: "boolean", value: true }],
                    ["b", { kind: "token", value: "b" }],
                  ],
                },
              ],
            },
            {
              kind: "item",
              value: [{ kind: "integer", value: 1 }, parameters],
            },
            {
              kind: "item",
              value: [{ kind: "string", value: "a" }, parameters],
            },
          ], parameters],
        },
      }],
      [`(  );*;abc=d ...`, {
        rest: " ...",
        output: {
          kind: "inner-list",
          value: [
            [],
            {
              kind: "parameters",
              value: [
                ["*", { kind: "boolean", value: true }],
                ["abc", { kind: "token", value: "d" }],
              ],
            },
          ],
        },
      }],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(parseInnerList(input), expected);
    });
  });

  it("should throw error if the input string is invalid", () => {
    const table: string[] = [
      "",
      " ",
      "(",
      "( ",
      ")(",
    ];

    table.forEach((input) => {
      assertThrows(() => parseInnerList(input));
    });
  });
});

describe("parseList", () => {
  it("should return parsed inner list if the input string is valid", () => {
    const table: [string, Parsed<List>][] = [
      ["", { rest: "", output: { kind: "list", value: [] } }],
      ["a", {
        rest: "",
        output: {
          kind: "list",
          value: [{
            kind: "item",
            value: [{ kind: "token", value: "a" }, parameters],
          }],
        },
      }],
      ["a, b,c ", {
        rest: "",
        output: {
          kind: "list",
          value: [
            {
              kind: "item",
              value: [{ kind: "token", value: "a" }, parameters],
            },
            {
              kind: "item",
              value: [{ kind: "token", value: "b" }, parameters],
            },
            {
              kind: "item",
              value: [{ kind: "token", value: "c" }, parameters],
            },
          ],
        },
      }],
      [`(), ()`, {
        rest: "",
        output: {
          kind: "list",
          value: [
            { kind: "inner-list", value: [[], parameters] },
            { kind: "inner-list", value: [[], parameters] },
          ],
        },
      }],
      [`();a;b;c`, {
        rest: "",
        output: {
          kind: "list",
          value: [
            {
              kind: "inner-list",
              value: [
                [],
                {
                  kind: "parameters",
                  value: [
                    ["a", { kind: "boolean", value: true }],
                    ["b", { kind: "boolean", value: true }],
                    ["c", { kind: "boolean", value: true }],
                  ],
                },
              ],
            },
          ],
        },
      }],
      [`"abc", token;a=100, ("def" token;a=?0);a=?0`, {
        rest: "",
        output: {
          kind: "list",
          value: [
            {
              kind: "item",
              value: [{ kind: "string", value: "abc" }, parameters],
            },
            {
              kind: "item",
              value: [
                { kind: "token", value: "token" },
                {
                  kind: "parameters",
                  value: [
                    ["a", { kind: "integer", value: 100 }],
                  ],
                },
              ],
            },
            {
              kind: "inner-list",
              value: [
                [
                  {
                    kind: "item",
                    value: [{ kind: "string", value: "def" }, parameters],
                  },
                  {
                    kind: "item",
                    value: [
                      { kind: "token", value: "token" },
                      {
                        kind: "parameters",
                        value: [
                          ["a", { kind: "boolean", value: false }],
                        ],
                      },
                    ],
                  },
                ],
                {
                  kind: "parameters",
                  value: [["a", { kind: "boolean", value: false }]],
                },
              ],
            },
          ],
        },
      }],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(parseList(input), expected);
    });
  });

  it("should throw error if the input string is invalid", () => {
    const table: string[] = [
      " ",
      "(),",
      "(), ",
      ",",
      " ,",
      " ,",
      ",,",
      "a,",
      "a, ",
    ];

    table.forEach((input) => {
      assertThrows(() => parseList(input));
    });
  });
});

describe("parseDictionary", () => {
  it("should return parsed dictionary if the input string is valid", () => {
    const table: [string, Parsed<Dictionary>][] = [
      ["", { rest: "", output: { kind: "dictionary", value: [] } }],
      ["a", {
        rest: "",
        output: {
          kind: "dictionary",
          value: [["a", {
            kind: "item",
            value: [
              { kind: "boolean", value: true },
              parameters,
            ],
          }]],
        },
      }],
      ["a=a", {
        rest: "",
        output: {
          kind: "dictionary",
          value: [["a", {
            kind: "item",
            value: [{ kind: "token", value: "a" }, parameters],
          }]],
        },
      }],
      ["a=(), b=(c d;e f;g=h i;j=k; l=n);m", {
        rest: "",
        output: {
          kind: "dictionary",
          value: [
            ["a", { kind: "inner-list", value: [[], parameters] }],
            ["b", {
              kind: "inner-list",
              value: [
                [
                  {
                    kind: "item",
                    value: [
                      { kind: "token", value: "c" },
                      parameters,
                    ],
                  },
                  {
                    kind: "item",
                    value: [
                      { kind: "token", value: "d" },
                      {
                        kind: "parameters",
                        value: [["e", { kind: "boolean", value: true }]],
                      },
                    ],
                  },
                  {
                    kind: "item",
                    value: [
                      { kind: "token", value: "f" },
                      {
                        kind: "parameters",
                        value: [["g", { kind: "token", value: "h" }]],
                      },
                    ],
                  },
                  {
                    kind: "item",
                    value: [
                      { kind: "token", value: "i" },
                      {
                        kind: "parameters",
                        value: [
                          ["j", { kind: "token", value: "k" }],
                          ["l", { kind: "token", value: "n" }],
                        ],
                      },
                    ],
                  },
                ],
                {
                  kind: "parameters",
                  value: [["m", { kind: "boolean", value: true }]],
                },
              ],
            }],
          ],
        },
      }],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(parseDictionary(input), expected);
    });
  });

  it("should throw error if the input string is invalid", () => {
    const table: string[] = [
      " ",
      "?",
    ];

    table.forEach((input) => {
      assertThrows(() => parseDictionary(input));
    });
  });
});
