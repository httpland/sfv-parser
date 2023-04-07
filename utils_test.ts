import { toDecimalFormat } from "./utils.ts";
import { assertEquals, describe, it } from "./_dev_deps.ts";

describe("toDecimalFormat", () => {
  it("should return decimal format", () => {
    const table: [number, string][] = [
      [0, "0.0"],
      [0.0, "0.0"],
      [0.01, "0.01"],
      [1.01, "1.01"],
      [100, "100.0"],
      [100.00001, "100.00001"],
      [100.00000, "100.0"],
      [NaN, "NaN"],
      [Infinity, "Infinity"],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(toDecimalFormat(input), expected);
    });
  });
});
