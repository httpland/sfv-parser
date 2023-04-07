// Copyright 2023-latest the httpland authors. All rights reserved. MIT license.
// This module is browser compatible.

import { Char, Kind } from "./constants.ts";
import { head, isString, pascalCase } from "./deps.ts";
import { type SfNode } from "./types.ts";

/** Scanner for character. */
export class Scanner {
  current: string;
  constructor(public readonly initial: string) {
    this.current = initial;
  }

  next(): string {
    const [first, rest] = divideOf(1, this.current);

    this.current = rest;

    return first;
  }

  get first(): string {
    return head(this.current);
  }
}

export function divideOf(
  index: number,
  input: string,
): [head: string, tail: string] {
  const head = input.slice(0, index);
  const tail = input.slice(index);

  return [head, tail];
}

export function divideBy(
  separator: string,
  input: string,
): null | [head: string, tail: string] {
  const index = input.indexOf(separator);

  if (index < 0) {
    return null;
  }

  const head = input.slice(0, index);
  const tail = input.slice(index + separator.length);

  return [head, tail];
}

export function trimStartBy(char: string, input: string): string {
  const pattern = new RegExp(`^${char}+`);

  return input.replace(pattern, "");
}

/** Trimming SP(x20) only. */
export function trimStart(input: string): string {
  return trimStartBy(Char.Space, input);
}

/** Return number of digits. */
export function numberOfDigits(input: number): number {
  return Math.abs(Math.trunc(input)).toString().length;
}

export function decimalPlaces(input: number): number {
  return divideBy(Char.Period, input.toString())?.[1]?.length ?? 0;
}

export function displayKey(input: string): string {
  return `key of "${input}"`;
}

export function displaySfNode(input: SfNode): string {
  const kind = pascalCase(input.kind);
  const content = isString(input.value)
    ? `"${input.value}"`
    : String(input.value);

  return `${kind} { ${content} }`;
}

export function toDecimalFormat(input: number): string {
  const str = input.toString();
  if (Number.isInteger(input)) return str + ".0";

  return str;
}

export function isTrue(
  input: SfNode,
): input is { kind: Kind.Boolean; value: true } {
  return input.kind === Kind.Boolean && input.value === true;
}
