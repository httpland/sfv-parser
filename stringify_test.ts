import {
  stringifyBareItem,
  stringifyBoolean,
  stringifyDecimal,
  stringifyInnerList,
  stringifyInteger,
  stringifyItem,
  stringifyParameters,
  stringifyString,
  stringifyToken,
} from "./stringify.ts";
import { assertEquals, assertThrows, describe, it, Type } from "./_dev_deps.ts";
import { BareItem, InnerList, Item, Parameters } from "./types.ts";

describe("stringifyBoolean", () => {
  it("should return ?1 if the input is true", () => {
    assertEquals(stringifyBoolean({ value: true, type: Type.Boolean }), "?1");
  });

  it("should return ?0 if the input is false", () => {
    assertEquals(stringifyBoolean({ value: false, type: Type.Boolean }), "?0");
  });
});

describe("stringifyToken", () => {
  it("should return string if the input is valid token", () => {
    const table: [string, string][] = [
      ["a", "a"],
      ["a:", "a:"],
      ["a/", "a/"],
      ["*", "*"],
      [
        "*:/!#$%&'*+.^_`|~0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "*:/!#$%&'*+.^_`|~0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      ],
      ["foo123/456", "foo123/456"],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(
        stringifyToken({ type: Type.Token, value: input }),
        expected,
      );
    });
  });

  it("should throw error if the input is invalid token", () => {
    const table: string[] = [
      "",
      "?",
      " ",
      "a ",
      " a",
      "!",
      "a<",
      "0",
    ];

    table.forEach((input) => {
      assertThrows(() => stringifyToken({ type: Type.Token, value: input }));
    });
  });
});

describe("stringifyInteger", () => {
  it("should return string if the input is valid integer", () => {
    const table: [number, string][] = [
      [0, "0"],
      [-0, "0"],
      [1, "1"],
      [-1, "-1"],
      [1.0, "1"],
      [-999999999999999, "-999999999999999"],
      [999999999999999, "999999999999999"],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(
        stringifyInteger({ type: Type.Integer, value: input }),
        expected,
      );
    });
  });

  it("should throw error if the input is invalid integer", () => {
    const table: number[] = [
      NaN,
      1.1,
      -1.1,
      Infinity,
      Number.MAX_VALUE,
      Number.MIN_VALUE,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.EPSILON,
    ];

    table.forEach((input) => {
      assertThrows(() =>
        stringifyInteger({ type: Type.Integer, value: input })
      );
    });
  });
});

describe("stringifyDecimal", () => {
  it("should return string if the input is valid decimal", () => {
    const table: [number, string][] = [
      [0, "0.0"],
      [-0, "0.0"],
      [0.010, "0.01"],
      [0.1234, "0.123"],
      [-0.1234, "-0.123"],
      [11111, "11111.0"],
      [11111.01010101, "11111.01"],
      [11111.111111, "11111.111"],
      [Number.EPSILON, "0.0"],
      [Math.PI, "3.142"],
      [1, "1.0"],
      [-1, "-1.0"],
      [-1.0125, "-1.012"],
      [-1.9999, "-2.0"],
      [1e11, "100000000000.0"],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(
        stringifyDecimal({ type: Type.Decimal, value: input }),
        expected,
      );
    });
  });

  it("should throw error if the input is invalid decimal", () => {
    const table: number[] = [
      NaN,
      Infinity,
      -Infinity,
      1e12,
      -1e12,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ];

    table.forEach((input) => {
      assertThrows(() =>
        stringifyDecimal({ type: Type.Decimal, value: input })
      );
    });
  });
});

describe("stringifyString", () => {
  it("should return string if the input is valid decimal", () => {
    const table: [string, string][] = [
      ["", `""`],
      ["abc", `"abc"`],
      ["\\abc", `"\\\\abc"`],
      [`"abc`, `"\\"abc"`],
      [` `, `" "`],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(
        stringifyString({ type: Type.String, value: input }),
        expected,
      );
    });
  });

  it("should throw error if the input is invalid string", () => {
    const table: string[] = [
      "\t",
      "\x00",
    ];

    table.forEach((input) => {
      assertThrows(() => stringifyString({ type: Type.String, value: input }));
    });
  });
});

describe("stringifyBareItem", () => {
  it("should return string if the input is valid bare item", () => {
    const table: [BareItem, string][] = [
      [{ type: Type.Decimal, value: 0 }, "0.0"],
      [{ type: Type.Boolean, value: false }, "?0"],
      [{ type: Type.Boolean, value: true }, "?1"],
      [{ type: Type.Integer, value: 0 }, "0"],
      [{ type: Type.Token, value: "*/abc" }, "*/abc"],
      [{ type: Type.Binary, value: new TextEncoder().encode("*") }, ":Kg==:"],
      // [{ type: Type.String, value: "*/abc" }, "*/abc"],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(stringifyBareItem(input), expected);
    });
  });

  it("should throw error", () => {
    assertThrows(() => stringifyBareItem({} as never));
  });
});

describe("stringifyParameters", () => {
  it("should return string if the input is valid parameters", () => {
    const table: [Parameters, string][] = [
      [{ type: Type.Parameters, value: [] }, ""],
      [{
        type: Type.Parameters,
        value: [["a", {
          type: Type.Boolean,
          value: false,
        }]],
      }, ";a=?0"],
      [{
        type: Type.Parameters,
        value: [
          ["a", { type: Type.Boolean, value: true }],
        ],
      }, ";a"],
      [{
        type: Type.Parameters,
        value: [
          ["*abc", { type: Type.Decimal, value: 1.2345 }],
        ],
      }, ";*abc=1.234"],
      [
        {
          type: Type.Parameters,
          value: [
            [
              "*abc",
              { type: Type.Decimal, value: 1.2345 },
            ],
            [
              "*def-",
              { type: Type.Integer, value: 100 },
            ],
            [
              "*",
              { type: Type.Token, value: "*" },
            ],
            [
              "test",
              { type: Type.String, value: "test" },
            ],
          ],
        },
        `;*abc=1.234;*def-=100;*=*;test="test"`,
      ],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(
        stringifyParameters(input),
        expected,
      );
    });
  });

  it("should throw error if the input is invalid parameters", () => {
    const table: Parameters["value"][] = [
      [["?", { type: Type.Boolean, value: false }]],
    ];

    table.forEach((input) => {
      assertThrows(() =>
        stringifyParameters({ type: Type.Parameters, value: input })
      );
    });
  });
});

describe("stringifyItem", () => {
  it("should return string if the input is valid item", () => {
    const table: [...Item["value"], string][] = [
      [{ type: Type.Token, value: "abc" }, {
        type: Type.Parameters,
        value: [],
      }, "abc"],
      [
        { type: Type.Token, value: "abc" },
        {
          type: Type.Parameters,
          value: [
            [
              "efg",
              { type: Type.Boolean, value: true },
            ],
          ],
        },
        "abc;efg",
      ],
      [
        { type: Type.Boolean, value: true },
        {
          type: Type.Parameters,
          value: [
            [
              "efg",
              { type: Type.Boolean, value: true },
            ],
            [
              "*",
              { type: Type.Decimal, value: 1.0 },
            ],
          ],
        },
        "?1;efg;*=1.0",
      ],
    ];

    table.forEach(([bareItem, parameters, expected]) => {
      assertEquals(
        stringifyItem({ type: Type.Item, value: [bareItem, parameters] }),
        expected,
      );
    });
  });
});

describe("stringifyInnerList", () => {
  it("should return string if the input is valid inner list", () => {
    const table: [InnerList["value"], string][] = [
      [
        [[], { type: Type.Parameters, value: [] }],
        "()",
      ],
      [
        [
          [{
            type: Type.Item,
            value: [{ type: Type.Decimal, value: 1.1 }, {
              type: Type.Parameters,
              value: [],
            }],
          }],
          { type: Type.Parameters, value: [] },
        ],
        "(1.1)",
      ],
      [[
        [{
          type: Type.Item,
          value: [
            { type: Type.Decimal, value: 1.1 },
            {
              type: Type.Parameters,
              value: [
                ["*", { type: Type.Token, value: "abc" }],
              ],
            },
          ],
        }],
        { type: Type.Parameters, value: [] },
      ], "(1.1;*=abc)"],
      [
        [
          [
            {
              type: Type.Item,
              value: [
                { type: Type.Decimal, value: 1.1 },
                {
                  type: Type.Parameters,
                  value: [
                    ["*", { type: Type.Token, value: "abc" }],
                  ],
                },
              ],
            },
            {
              type: Type.Item,
              value: [
                { type: Type.Integer, value: 11 },
                {
                  type: Type.Parameters,
                  value: [
                    ["abc", { type: Type.Token, value: "def" }],
                  ],
                },
              ],
            },
          ],
          { type: Type.Parameters, value: [] },
        ],
        "(1.1;*=abc 11;abc=def)",
      ],
      [[
        [],
        {
          type: Type.Parameters,
          value: [
            ["abc", { type: Type.Boolean, value: false }],
          ],
        },
      ], "();abc=?0"],
    ];

    table.forEach(([value, expected]) => {
      assertEquals(
        stringifyInnerList({ type: Type.InnerList, value }),
        expected,
      );
    });
  });
});
