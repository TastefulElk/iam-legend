import { match } from "../../domain/utility";

describe("[match]", () => {
  it("should match same values", () => {
    expect(match("abc", "abc")).toBe(true);
  });

  it("should not match different values", () => {
    expect(match("abc", "def")).toBe(false);
  });

  it("should not match if substring", () => {
    expect(match("abc", "abcdef")).toBe(false);
    expect(match("abc", "defabc")).toBe(false);
  });

  it("should respect * wildcard at start", () => {
    expect(match("*def", "abcdef")).toBe(true);
  });

  it("should respect * wildcard at end", () => {
    expect(match("abc*", "abcdef")).toBe(true);
  });

  it("should respect * wildcard in the middle", () => {
    expect(match("ab*ef", "abcdef")).toBe(true);
  });

  it("should respect multiple * wildcards", () => {
    expect(match("a*c*ef", "abcdef")).toBe(true);
  });
});
