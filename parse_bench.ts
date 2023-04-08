import { parseSfv } from "./parse.ts";

import largeGenerated from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/large-generated.json" assert {
  type: "json",
};
import * as v1 from "https://deno.land/x/sfv_parser@1.0.0-beta.3/mod.ts";

const fieldValue = largeGenerated[0]?.raw.join("") ?? "";

Deno.bench("latest", { baseline: true, group: "parse" }, () => {
  parseSfv(fieldValue, "dictionary");
});
Deno.bench("past", { group: "parse" }, () => {
  v1.parseSfv(fieldValue, "dictionary");
});
