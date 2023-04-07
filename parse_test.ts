import {
  getParser,
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
import { assertEquals, assertThrows, describe, it, Type } from "./_dev_deps.ts";

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
        output: { type: Type.Boolean, value: expected.output },
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
        output: { type: Type.Token, value: expected.output },
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
        output: { type: Type.String, value: expected.output },
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
        output: { type: Type.Integer, value: expected.output },
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
        output: { type: Type.Decimal, value: expected.output },
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
        output: { type: Type.Binary, value: expected.output },
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
      [`"a"...`, { rest: "...", output: { type: Type.String, value: "a" } }],
      [`100 ...`, { rest: " ...", output: { type: Type.Integer, value: 100 } }],
      [`100.1 ...`, {
        rest: " ...",
        output: { type: Type.Decimal, value: 100.1 },
      }],
      [`?0...`, {
        rest: "...",
        output: { type: Type.Boolean, value: false },
      }],
      [`a ...`, {
        rest: " ...",
        output: { type: Type.Token, value: "a" },
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

const parameters = { type: Type.Parameters, value: [] } as const;

describe("parseParameters", () => {
  it("should return parsed parameters if the input string is valid", () => {
    const table: [string, Parsed<Parameters>][] = [
      ["", { rest: "", output: parameters }],
      ["a", { rest: "a", output: parameters }],
      ["abc", { rest: "abc", output: parameters }],
      [";a", {
        rest: "",
        output: {
          type: Type.Parameters,
          value: [["a", { type: Type.Boolean, value: true }]],
        },
      }],
      ["; a", {
        rest: "",
        output: {
          type: Type.Parameters,
          value: [["a", { type: Type.Boolean, value: true }]],
        },
      }],
      [";a =", {
        rest: " =",
        output: {
          type: Type.Parameters,
          value: [["a", { type: Type.Boolean, value: true }]],
        },
      }],
      [";a?", {
        rest: "?",
        output: {
          type: Type.Parameters,
          value: [["a", { type: Type.Boolean, value: true }]],
        },
      }],
      ["; a=?0", {
        rest: "",
        output: {
          type: Type.Parameters,
          value: [["a", { type: Type.Boolean, value: false }]],
        },
      }],
      [";*=?0", {
        rest: "",
        output: {
          type: Type.Parameters,
          value: [["*", { type: Type.Boolean, value: false }]],
        },
      }],
      [";*=?1", {
        rest: "",
        output: {
          type: Type.Parameters,
          value: [["*", { type: Type.Boolean, value: true }]],
        },
      }],
      [";*=1-", {
        rest: "-",
        output: {
          type: Type.Parameters,
          value: [["*", { type: Type.Integer, value: 1 }]],
        },
      }],
      [";*=100", {
        rest: "",
        output: {
          type: Type.Parameters,
          value: [["*", { type: Type.Integer, value: 100 }]],
        },
      }],
      [";*=100.0 ", {
        rest: " ",
        output: {
          type: Type.Parameters,
          value: [["*", { type: Type.Decimal, value: 100 }]],
        },
      }],
      [`;*="abc"`, {
        rest: "",
        output: {
          type: Type.Parameters,
          value: [["*", { type: Type.String, value: "abc" }]],
        },
      }],
      [`;a="abc"; b=::; c=abc`, {
        rest: "",
        output: {
          type: Type.Parameters,
          value: [
            ["a", { type: Type.String, value: "abc" }],
            ["b", { type: Type.Binary, value: new Uint8Array() }],
            ["c", { type: Type.Token, value: "abc" }],
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
          type: Type.Item,
          value: [{ type: Type.Integer, value: 1 }, parameters],
        },
      }],
      ["1.0a", {
        rest: "a",
        output: {
          type: Type.Item,
          value: [{ type: Type.Decimal, value: 1 }, parameters],
        },
      }],
      ["1.0 ;", {
        rest: " ;",
        output: {
          type: Type.Item,
          value: [{ type: Type.Decimal, value: 1 }, parameters],
        },
      }],
      ["1.0;a", {
        rest: "",
        output: {
          type: Type.Item,
          value: [
            { type: Type.Decimal, value: 1 },
            {
              type: Type.Parameters,
              value: [["a", { type: Type.Boolean, value: true }]],
            },
          ],
        },
      }],
      ["a;a=?0", {
        rest: "",
        output: {
          type: Type.Item,
          value: [
            { type: Type.Token, value: "a" },
            {
              type: Type.Parameters,
              value: [["a", { type: Type.Boolean, value: false }]],
            },
          ],
        },
      }],
      [`a;*=?1; a="test" ;b`, {
        rest: " ;b",
        output: {
          type: Type.Item,
          value: [
            { type: Type.Token, value: "a" },
            {
              type: Type.Parameters,
              value: [
                ["*", { type: Type.Boolean, value: true }],
                ["a", { type: Type.String, value: "test" }],
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
        output: { type: Type.InnerList, value: [[], parameters] },
      }],
      ["( )", {
        rest: "",
        output: { type: Type.InnerList, value: [[], parameters] },
      }],
      ["()abc", {
        rest: "abc",
        output: { type: Type.InnerList, value: [[], parameters] },
      }],
      ["(a)", {
        rest: "",
        output: {
          type: Type.InnerList,
          value: [
            [{
              type: Type.Item,
              value: [{ type: Type.Token, value: "a" }, parameters],
            }],
            parameters,
          ],
        },
      }],

      ["(1.0 1)", {
        rest: "",
        output: {
          type: Type.InnerList,
          value: [
            [
              {
                type: Type.Item,
                value: [{ type: Type.Decimal, value: 1 }, parameters],
              },
              {
                type: Type.Item,
                value: [{ type: Type.Integer, value: 1 }, parameters],
              },
            ],
            parameters,
          ],
        },
      }],
      [`( 1.1 1  "a")...`, {
        rest: "...",
        output: {
          type: Type.InnerList,
          value: [[
            {
              type: Type.Item,
              value: [{ type: Type.Decimal, value: 1.1 }, parameters],
            },
            {
              type: Type.Item,
              value: [{ type: Type.Integer, value: 1 }, parameters],
            },
            {
              type: Type.Item,
              value: [{ type: Type.String, value: "a" }, parameters],
            },
          ], parameters],
        },
      }],
      [`( 1.1; a; b=b 1  "a" )...`, {
        rest: "...",
        output: {
          type: Type.InnerList,
          value: [[
            {
              type: Type.Item,
              value: [
                { type: Type.Decimal, value: 1.1 },
                {
                  type: Type.Parameters,
                  value: [
                    ["a", { type: Type.Boolean, value: true }],
                    ["b", { type: Type.Token, value: "b" }],
                  ],
                },
              ],
            },
            {
              type: Type.Item,
              value: [{ type: Type.Integer, value: 1 }, parameters],
            },
            {
              type: Type.Item,
              value: [{ type: Type.String, value: "a" }, parameters],
            },
          ], parameters],
        },
      }],
      [`(  );*;abc=d ...`, {
        rest: " ...",
        output: {
          type: Type.InnerList,
          value: [
            [],
            {
              type: Type.Parameters,
              value: [
                ["*", { type: Type.Boolean, value: true }],
                ["abc", { type: Type.Token, value: "d" }],
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
      ["", { rest: "", output: { type: Type.List, value: [] } }],
      ["a", {
        rest: "",
        output: {
          type: Type.List,
          value: [{
            type: Type.Item,
            value: [{ type: Type.Token, value: "a" }, parameters],
          }],
        },
      }],
      ["a, b,c ", {
        rest: "",
        output: {
          type: Type.List,
          value: [
            {
              type: Type.Item,
              value: [{ type: Type.Token, value: "a" }, parameters],
            },
            {
              type: Type.Item,
              value: [{ type: Type.Token, value: "b" }, parameters],
            },
            {
              type: Type.Item,
              value: [{ type: Type.Token, value: "c" }, parameters],
            },
          ],
        },
      }],
      [`(), ()`, {
        rest: "",
        output: {
          type: Type.List,
          value: [
            { type: Type.InnerList, value: [[], parameters] },
            { type: Type.InnerList, value: [[], parameters] },
          ],
        },
      }],
      [`();a;b;c`, {
        rest: "",
        output: {
          type: Type.List,
          value: [
            {
              type: Type.InnerList,
              value: [
                [],
                {
                  type: Type.Parameters,
                  value: [
                    ["a", { type: Type.Boolean, value: true }],
                    ["b", { type: Type.Boolean, value: true }],
                    ["c", { type: Type.Boolean, value: true }],
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
          type: Type.List,
          value: [
            {
              type: Type.Item,
              value: [{ type: Type.String, value: "abc" }, parameters],
            },
            {
              type: Type.Item,
              value: [
                { type: Type.Token, value: "token" },
                {
                  type: Type.Parameters,
                  value: [
                    ["a", { type: Type.Integer, value: 100 }],
                  ],
                },
              ],
            },
            {
              type: Type.InnerList,
              value: [
                [
                  {
                    type: Type.Item,
                    value: [{ type: Type.String, value: "def" }, parameters],
                  },
                  {
                    type: Type.Item,
                    value: [
                      { type: Type.Token, value: "token" },
                      {
                        type: Type.Parameters,
                        value: [
                          ["a", { type: Type.Boolean, value: false }],
                        ],
                      },
                    ],
                  },
                ],
                {
                  type: Type.Parameters,
                  value: [["a", { type: Type.Boolean, value: false }]],
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
      ["", { rest: "", output: { type: Type.Dictionary, value: [] } }],
      ["a", {
        rest: "",
        output: {
          type: Type.Dictionary,
          value: [["a", {
            type: Type.Item,
            value: [
              { type: Type.Boolean, value: true },
              parameters,
            ],
          }]],
        },
      }],
      ["a=a", {
        rest: "",
        output: {
          type: Type.Dictionary,
          value: [["a", {
            type: Type.Item,
            value: [{ type: Type.Token, value: "a" }, parameters],
          }]],
        },
      }],
      ["a=(), b=(c d;e f;g=h i;j=k; l=n);m", {
        rest: "",
        output: {
          type: Type.Dictionary,
          value: [
            ["a", { type: Type.InnerList, value: [[], parameters] }],
            ["b", {
              type: Type.InnerList,
              value: [
                [
                  {
                    type: Type.Item,
                    value: [
                      { type: Type.Token, value: "c" },
                      parameters,
                    ],
                  },
                  {
                    type: Type.Item,
                    value: [
                      { type: Type.Token, value: "d" },
                      {
                        type: Type.Parameters,
                        value: [["e", { type: Type.Boolean, value: true }]],
                      },
                    ],
                  },
                  {
                    type: Type.Item,
                    value: [
                      { type: Type.Token, value: "f" },
                      {
                        type: Type.Parameters,
                        value: [["g", { type: Type.Token, value: "h" }]],
                      },
                    ],
                  },
                  {
                    type: Type.Item,
                    value: [
                      { type: Type.Token, value: "i" },
                      {
                        type: Type.Parameters,
                        value: [
                          ["j", { type: Type.Token, value: "k" }],
                          ["l", { type: Type.Token, value: "n" }],
                        ],
                      },
                    ],
                  },
                ],
                {
                  type: Type.Parameters,
                  value: [["m", { type: Type.Boolean, value: true }]],
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

describe("getParser", () => {
  it("should throw error", () => {
    assertThrows(() => getParser("" as never));
  });
});
