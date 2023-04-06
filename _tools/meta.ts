import { BuildOptions } from "https://deno.land/x/dnt@0.33.1/mod.ts";

export const makeOptions = (version: string): BuildOptions => ({
  test: false,
  shims: {},
  compilerOptions: {
    lib: ["dom", "esnext"],
  },
  typeCheck: true,
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
    "https://deno.land/x/isx@1.1.1/iterable/is_empty.ts": {
      name: "@miyauci/isx",
      version: "1.1.1",
      subPath: "iterable/is_empty",
    },
  },
});
