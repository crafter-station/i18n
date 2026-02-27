export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸", targetCode: "en-us" },
  { code: "es", name: "Spanish", flag: "🇪🇸", targetCode: "es" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", targetCode: "pt-br" },
  { code: "fr", name: "French", flag: "🇫🇷", targetCode: "fr" },
  { code: "de", name: "German", flag: "🇩🇪", targetCode: "de" },
  { code: "it", name: "Italian", flag: "🇮🇹", targetCode: "it" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", targetCode: "ja" },
  { code: "ko", name: "Korean", flag: "🇰🇷", targetCode: "ko" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", targetCode: "zh" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", targetCode: "ar-sa" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const SUPPORTED_LANGUAGE_CODES = new Set<string>(
  SUPPORTED_LANGUAGES.map((l) => l.code),
);

export function isValidLanguageCode(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGE_CODES.has(code);
}

export function assertLanguageCode(code: string): LanguageCode {
  if (!isValidLanguageCode(code)) {
    throw new Error(
      `Invalid language code: ${code}. Must be one of: ${SUPPORTED_LANGUAGES.map((l) => l.code).join(", ")}`,
    );
  }
  return code;
}

export function getLanguageName(code: string): string {
  return (
    SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name || code.toUpperCase()
  );
}

export function getLanguageFlag(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.flag || "🌐";
}

export function getTargetCode(code: string): string {
  return (
    SUPPORTED_LANGUAGES.find((l) => l.code === code)?.targetCode || code
  );
}
