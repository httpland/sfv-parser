import { BuildOptions } from "https://deno.land/x/dnt@0.34.0/mod.ts";

export const makeOptions = (version: string): BuildOptions => ({
  test: false,
  shims: {},
  compilerOptions: {
    lib: ["dom", "esnext"],
  },
  typeCheck: false,
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  package: {
    name: "@httpland/sfv-parser",
    version,
    description: "Structured Field Values for HTTP parser and serializer",
    keywords: [
      "http",
      "parse",
      "parser",
      "header",
      "serializer",
      "serialize",
      "stringify",
      "field",
      "rfc-8941",
    ],
    license: "MIT",
    homepage: "https://github.com/httpland/sfv-parser",
    repository: {
      type: "git",
      url: "git+https://github.com/httpland/sfv-parser.git",
    },
    bugs: {
      url: "https://github.com/httpland/sfv-parser/issues",
    },
    sideEffects: false,
    type: "module",
    publishConfig: {
      access: "public",
    },
  },
  packageManager: "pnpm",
  mappings: {
    "https://deno.land/x/isx@1.1.1/is_string.ts": {
      name: "@miyauci/isx",
      version: "1.1.1",
      subPath: "is_string",
    },
    "https://esm.sh/round-half-even@1.3.0?pin=v114": {
      name: "round-half-even",
      version: "1.3.0",
    },
  },
});
