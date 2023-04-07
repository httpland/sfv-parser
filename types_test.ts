import {
  Binary,
  Boolean,
  Decimal,
  Dictionary,
  InnerList,
  Integer,
  Item,
  List,
  Parameters,
  String,
  Token,
} from "./types.ts";
import { assertEquals, describe, it, Kind } from "./_dev_deps.ts";

describe("Boolean", () => {
  it("should has kind", () => {
    assertEquals(new Boolean(true).kind, Kind.Boolean);
  });

  it("should has value", () => {
    assertEquals(new Boolean(true).value, true);
    assertEquals(new Boolean(false).value, false);
  });
});

describe("String", () => {
  it("should has kind", () => {
    assertEquals(new String("").kind, Kind.String);
  });

  it("should has value", () => {
    assertEquals(new String("").value, "");
    assertEquals(new String("abc").value, "abc");
  });
});

describe("Token", () => {
  it("should has kind", () => {
    assertEquals(new Token("").kind, Kind.Token);
  });

  it("should has value", () => {
    assertEquals(new Token("").value, "");
    assertEquals(new Token("abc").value, "abc");
  });
});

describe("Integer", () => {
  it("should has kind", () => {
    assertEquals(new Integer(0).kind, Kind.Integer);
  });

  it("should has value", () => {
    assertEquals(new Integer(0).value, 0);
    assertEquals(new Integer(1).value, 1);
  });
});

describe("Decimal", () => {
  it("should has kind", () => {
    assertEquals(new Decimal(0).kind, Kind.Decimal);
  });

  it("should has value", () => {
    assertEquals(new Decimal(0).value, 0);
    assertEquals(new Decimal(1.1).value, 1.1);
  });
});

describe("Binary", () => {
  it("should has kind", () => {
    assertEquals(new Binary(new Uint8Array()).kind, Kind.Binary);
  });

  it("should has value", () => {
    assertEquals(new Binary(new Uint8Array()).value, new Uint8Array());
  });
});

describe("Item", () => {
  it("should has kind", () => {
    assertEquals(
      new Item([new Boolean(false), new Parameters()]).kind,
      Kind.Item,
    );
  });

  it("should has value", () => {
    assertEquals(new Item([new Boolean(false), new Parameters()]).value, [
      new Boolean(false),
      new Parameters(),
    ]);
  });
});

describe("List", () => {
  it("should has kind", () => {
    assertEquals(new List().kind, Kind.List);
  });

  it("should has value", () => {
    assertEquals(new List().value, []);
  });
});

describe("InnerList", () => {
  it("should has kind", () => {
    assertEquals(
      new InnerList([
        [
          new Item([new Boolean(false), new Parameters()]),
        ],
        new Parameters(),
      ]).kind,
      Kind.InnerList,
    );
  });

  it("should has value", () => {
    assertEquals(
      new InnerList([
        [
          new Item([new Boolean(false), new Parameters()]),
        ],
        new Parameters(),
      ]).value,
      [
        [
          new Item([new Boolean(false), new Parameters()]),
        ],
        new Parameters(),
      ],
    );
  });
});

describe("Parameters", () => {
  it("should has kind", () => {
    assertEquals(new Parameters().kind, Kind.Parameters);
  });

  it("should has value", () => {
    assertEquals(new Parameters([]).value, []);
    assertEquals(new Parameters({ a: new Boolean(false) }).value, [
      ["a", new Boolean(false)],
    ]);
    assertEquals(
      new Parameters([
        ["a", new Boolean(false)],
      ]).value,
      [
        ["a", new Boolean(false)],
      ],
    );
  });
});

describe("Dictionary", () => {
  it("should has kind", () => {
    assertEquals(
      new Dictionary().kind,
      Kind.Dictionary,
    );
  });

  it("should has value", () => {
    assertEquals(
      new Dictionary({
        a: new Item([new Boolean(false), new Parameters()]),
      }).value,
      [
        ["a", new Item([new Boolean(false), new Parameters()])],
      ],
    );

    assertEquals(
      new Dictionary([
        ["a", new Item([new Boolean(false), new Parameters()])],
      ])
        .value,
      [
        ["a", new Item([new Boolean(false), new Parameters()])],
      ],
    );
  });
});
