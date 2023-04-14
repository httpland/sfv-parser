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
import { assertEquals, describe, it, Type } from "./_dev_deps.ts";

describe("Boolean", () => {
  it("should has type", () => {
    assertEquals(new Boolean(true).type, Type.Boolean);
  });

  it("should has value", () => {
    assertEquals(new Boolean(true).value, true);
    assertEquals(new Boolean(false).value, false);
  });
});

describe("String", () => {
  it("should has type", () => {
    assertEquals(new String("").type, Type.String);
  });

  it("should has value", () => {
    assertEquals(new String("").value, "");
    assertEquals(new String("abc").value, "abc");
  });
});

describe("Token", () => {
  it("should has type", () => {
    assertEquals(new Token("").type, Type.Token);
  });

  it("should has value", () => {
    assertEquals(new Token("").value, "");
    assertEquals(new Token("abc").value, "abc");
  });
});

describe("Integer", () => {
  it("should has type", () => {
    assertEquals(new Integer(0).type, Type.Integer);
  });

  it("should has value", () => {
    assertEquals(new Integer(0).value, 0);
    assertEquals(new Integer(1).value, 1);
  });
});

describe("Decimal", () => {
  it("should has type", () => {
    assertEquals(new Decimal(0).type, Type.Decimal);
  });

  it("should has value", () => {
    assertEquals(new Decimal(0).value, 0);
    assertEquals(new Decimal(1.1).value, 1.1);
  });
});

describe("Binary", () => {
  it("should has type", () => {
    assertEquals(new Binary(new Uint8Array()).type, Type.Binary);
  });

  it("should has value", () => {
    assertEquals(new Binary(new Uint8Array()).value, new Uint8Array());
  });
});

describe("Item", () => {
  it("should has type", () => {
    assertEquals(
      new Item([new Boolean(false), new Parameters()]).type,
      Type.Item,
    );
  });

  it("should accept bare item only", () => {
    assertEquals(
      new Item(new Boolean(false)),
      new Item([new Boolean(false), new Parameters()]),
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
  it("should has type", () => {
    assertEquals(new List().type, Type.List);
  });

  it("should has value", () => {
    assertEquals(new List().value, []);
  });
});

describe("InnerList", () => {
  it("should has type", () => {
    assertEquals(
      new InnerList([
        [
          new Item([new Boolean(false), new Parameters()]),
        ],
        new Parameters(),
      ]).type,
      Type.InnerList,
    );
  });

  it("should accept array of item only", () => {
    assertEquals(
      new InnerList([[], new Parameters()]),
      new InnerList([]),
    );
  });

  it("should accept array of item only", () => {
    assertEquals(
      new InnerList([[
        new Item(new Boolean(false)),
        new Item(new Boolean(true)),
      ], new Parameters()]),
      new InnerList([
        new Item(new Boolean(false)),
        new Item(new Boolean(true)),
      ]),
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
  it("should has type", () => {
    assertEquals(new Parameters().type, Type.Parameters);
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
  it("should has type", () => {
    assertEquals(
      new Dictionary().type,
      Type.Dictionary,
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
