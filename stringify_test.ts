import {
  stringifyBareItem,
  stringifyBoolean,
  stringifyDecimal,
  stringifyInnerList,
  stringifyInteger,
  stringifyItem,
  stringifyParameters,
  stringifyToken,
} from "./stringify.ts";
import { assertEquals, assertThrows, describe, it, Kind } from "./_dev_deps.ts";
import { BareItem, InnerList, Item, Parameters } from "./types.ts";

describe("stringifyBoolean", () => {
  it("should return ?1 if the input is true", () => {
    assertEquals(stringifyBoolean({ value: true, kind: Kind.Boolean }), "?1");
  });

  it("should return ?0 if the input is false", () => {
    assertEquals(stringifyBoolean({ value: false, kind: Kind.Boolean }), "?0");
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
        stringifyToken({ kind: Kind.Token, value: input }),
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
      assertThrows(() => stringifyToken({ kind: Kind.Token, value: input }));
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
        stringifyInteger({ kind: Kind.Integer, value: input }),
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
        stringifyInteger({ kind: Kind.Integer, value: input })
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
        stringifyDecimal({ kind: Kind.Decimal, value: input }),
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
        stringifyDecimal({ kind: Kind.Decimal, value: input })
      );
    });
  });
});

describe("stringifyBareItem", () => {
  it("should return string if the input is valid bare item", () => {
    const table: [BareItem, string][] = [
      [{ kind: Kind.Decimal, value: 0 }, "0.0"],
      [{ kind: Kind.Boolean, value: false }, "?0"],
      [{ kind: Kind.Boolean, value: true }, "?1"],
      [{ kind: Kind.Integer, value: 0 }, "0"],
      [{ kind: Kind.Token, value: "*/abc" }, "*/abc"],
      [{ kind: Kind.Binary, value: new TextEncoder().encode("*") }, ":Kg==:"],
      // [{ kind: Kind.String, value: "*/abc" }, "*/abc"],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(stringifyBareItem(input), expected);
    });
  });
});

describe("stringifyParameters", () => {
  it("should return string if the input is valid parameters", () => {
    const table: [Parameters, string][] = [
      [{ kind: Kind.Parameters, value: [] }, ""],
      [{
        kind: Kind.Parameters,
        value: [["a", {
          kind: Kind.Boolean,
          value: false,
        }]],
      }, ";a=?0"],
      [{
        kind: Kind.Parameters,
        value: [
          ["a", { kind: Kind.Boolean, value: true }],
        ],
      }, ";a"],
      [{
        kind: Kind.Parameters,
        value: [
          ["*abc", { kind: Kind.Decimal, value: 1.2345 }],
        ],
      }, ";*abc=1.234"],
      [
        {
          kind: Kind.Parameters,
          value: [
            [
              "*abc",
              { kind: Kind.Decimal, value: 1.2345 },
            ],
            [
              "*def-",
              { kind: Kind.Integer, value: 100 },
            ],
            [
              "*",
              { kind: Kind.Token, value: "*" },
            ],
            [
              "test",
              { kind: Kind.String, value: "test" },
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
      [["?", { kind: Kind.Boolean, value: false }]],
    ];

    table.forEach((input) => {
      assertThrows(() =>
        stringifyParameters({ kind: Kind.Parameters, value: input })
      );
    });
  });
});

describe("stringifyItem", () => {
  it("should return string if the input is valid item", () => {
    const table: [...Item["value"], string][] = [
      [{ kind: Kind.Token, value: "abc" }, {
        kind: Kind.Parameters,
        value: [],
      }, "abc"],
      [
        { kind: Kind.Token, value: "abc" },
        {
          kind: Kind.Parameters,
          value: [
            [
              "efg",
              { kind: Kind.Boolean, value: true },
            ],
          ],
        },
        "abc;efg",
      ],
      [
        { kind: Kind.Boolean, value: true },
        {
          kind: Kind.Parameters,
          value: [
            [
              "efg",
              { kind: Kind.Boolean, value: true },
            ],
            [
              "*",
              { kind: Kind.Decimal, value: 1.0 },
            ],
          ],
        },
        "?1;efg;*=1.0",
      ],
    ];

    table.forEach(([bareItem, parameters, expected]) => {
      assertEquals(
        stringifyItem({ kind: Kind.Item, value: [bareItem, parameters] }),
        expected,
      );
    });
  });
});

describe("stringifyInnerList", () => {
  it("should return string if the input is valid inner list", () => {
    const table: [InnerList["value"], string][] = [
      [
        [[], { kind: "parameters", value: [] }],
        "()",
      ],
      [
        [
          [{
            kind: Kind.Item,
            value: [{ kind: Kind.Decimal, value: 1.1 }, {
              kind: Kind.Parameters,
              value: [],
            }],
          }],
          { kind: "parameters", value: [] },
        ],
        "(1.1)",
      ],
      [[
        [{
          kind: Kind.Item,
          value: [
            { kind: Kind.Decimal, value: 1.1 },
            {
              kind: Kind.Parameters,
              value: [
                ["*", { kind: Kind.Token, value: "abc" }],
              ],
            },
          ],
        }],
        { kind: "parameters", value: [] },
      ], "(1.1;*=abc)"],
      [
        [
          [
            {
              kind: Kind.Item,
              value: [
                { kind: Kind.Decimal, value: 1.1 },
                {
                  kind: Kind.Parameters,
                  value: [
                    ["*", { kind: Kind.Token, value: "abc" }],
                  ],
                },
              ],
            },
            {
              kind: Kind.Item,
              value: [
                { kind: Kind.Integer, value: 11 },
                {
                  kind: Kind.Parameters,
                  value: [
                    ["abc", { kind: Kind.Token, value: "def" }],
                  ],
                },
              ],
            },
          ],
          { kind: "parameters", value: [] },
        ],
        "(1.1;*=abc 11;abc=def)",
      ],
      [[
        [],
        {
          kind: "parameters",
          value: [
            ["abc", { kind: "boolean", value: false }],
          ],
        },
      ], "();abc=?0"],
    ];

    table.forEach(([value, expected]) => {
      assertEquals(
        stringifyInnerList({ kind: Kind.InnerList, value }),
        expected,
      );
    });
  });
});
