import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

function leafEntries(obj: Json, prefix = ""): [string, string][] {
  if (typeof obj === "string") return [[prefix, obj]];
  if (obj && typeof obj === "object") {
    return Object.entries(obj).flatMap(([k, v]) =>
      leafEntries(v as Json, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [];
}

const placeholders = (s: string) =>
  (s.match(/\{[a-zA-Z0-9_]+\}/g) ?? []).sort();

const enLeaves = new Map(leafEntries(en as Json));
const viLeaves = new Map(leafEntries(vi as Json));

describe("client-web i18n parity", () => {
  it("en and vi share identical key sets", () => {
    expect([...viLeaves.keys()].sort()).toEqual([...enLeaves.keys()].sort());
  });

  it("each leaf uses the same ICU placeholders across languages", () => {
    for (const [key, enValue] of enLeaves) {
      const viValue = viLeaves.get(key);
      if (viValue === undefined) continue;
      expect(placeholders(viValue), `placeholders for ${key}`).toEqual(
        placeholders(enValue),
      );
    }
  });
});
