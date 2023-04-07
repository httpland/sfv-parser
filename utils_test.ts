import { decimalPlaces, toDecimalFormat } from "./utils.ts";
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

describe("decimalPlaces", () => {
  it("should return decimal places", () => {
    const table: [number, number][] = [
      [0, 0],
      [0.1, 1],
      [100, 0],
      [0.00001, 5],
      [0.123456789, 9],
      [654321.11111111, 8],
      [NaN, 0],
      [Infinity, 0],
      [-Infinity, 0],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(decimalPlaces(input), expected);
    });
  });
});
