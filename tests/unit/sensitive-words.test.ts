import { describe, expect, it } from "vitest";
import { assertNoSensitiveWords, findSensitiveWordsInFields, SensitiveContentError } from "@/lib/content-compliance";
import { findSensitiveWords } from "@/lib/sensitive-words";

describe("findSensitiveWords", () => {
  it("returns words that are not allowed in compliant content", () => {
    expect(findSensitiveWords("今晚方向仅供参考，不能保证命中，也不是跟单。")).toEqual(["跟单", "保证命中"]);
  });

  it("returns an empty list for neutral analysis text", () => {
    expect(findSensitiveWords("主队不败倾向较高，但需要防平。")).toEqual([]);
  });

  it("collects sensitive words across prediction, review, and ad fields", () => {
    expect(findSensitiveWordsInFields(["预测仅供参考", ["比分 1-0", "不提供跟单"], "广告不承诺稳赚"])).toEqual([
      "稳赚",
      "跟单",
    ]);
  });

  it("throws a typed error before saving sensitive content", () => {
    expect(() => assertNoSensitiveWords(["本场不做包红承诺"])).toThrow(SensitiveContentError);
  });
});
