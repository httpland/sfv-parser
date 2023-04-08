import { parseSfv } from "./parse.ts";

import largeGenerated from "https://cdn.jsdelivr.net/gh/httpwg/structured-field-tests/large-generated.json" assert {
  type: "json",
};
import * as v1_0_0 from "https://deno.land/x/sfv_parser@1.0.0/mod.ts";

const fieldValue = largeGenerated[0]?.raw.join("") ?? "";

Deno.bench("latest", { baseline: true, group: "parse" }, () => {
  parseSfv(fieldValue, "Dictionary");
});
Deno.bench("past", { group: "parse" }, () => {
  v1_0_0.parseSfv(fieldValue, "Dictionary");
});
