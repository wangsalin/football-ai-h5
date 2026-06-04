import { findSensitiveWords } from "@/lib/sensitive-words";

type TextValue = string | string[] | null | undefined;

export class SensitiveContentError extends Error {
  words: string[];

  constructor(words: string[]) {
    super(`Sensitive content detected: ${words.join(", ")}`);
    this.name = "SensitiveContentError";
    this.words = words;
  }
}

export function collectText(values: TextValue[]) {
  return values.flatMap((value) => (Array.isArray(value) ? value : [value])).filter(Boolean).join("\n");
}

export function findSensitiveWordsInFields(values: TextValue[]) {
  return [...new Set(findSensitiveWords(collectText(values)))];
}

export function assertNoSensitiveWords(values: TextValue[]) {
  const words = findSensitiveWordsInFields(values);

  if (words.length > 0) {
    throw new SensitiveContentError(words);
  }
}

export function isSensitiveContentError(error: unknown): error is SensitiveContentError {
  return error instanceof SensitiveContentError;
}
