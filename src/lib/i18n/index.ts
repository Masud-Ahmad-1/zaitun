import { en } from "./en";
import bn from "./bn";
import type { Dictionary } from "./en";

const dictionaries: Record<string, Dictionary> = { en, bn: bn as unknown as Dictionary };

export function t(locale: string, path: string): string {
  const dict = dictionaries[locale] || dictionaries.en;
  const keys = path.split(".");
  let result: unknown = dict;
  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = result[key];
    } else {
      return path;
    }
  }
  return typeof result === "string" ? result : path;
}

// Suppress unused import warning — bn is used dynamically
void bn;