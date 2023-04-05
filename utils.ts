// Copyright 2023-latest the httpland authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isString } from "./deps.ts";

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
    return this.current[0] ?? "";
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

export function last<T>(input: readonly [...unknown[], T]): T;
export function last<T>(input: Iterable<T>): T | undefined;
export function last<T>(input: Iterable<T>): T | undefined {
  return [...input].pop();
}

export function first<T extends string>(input: `${T}${string}`): T;
export function first(input: string): string;
export function first<const T>(input: readonly [T, ...unknown[]]): T;
export function first<T>(input: Iterable<T>): T | undefined;
export function first<T>(input: Iterable<T>): T | undefined {
  const element = [...input][0];

  return isString(input) ? element ?? "" as T : element;
}
