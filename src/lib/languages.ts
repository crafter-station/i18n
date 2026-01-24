export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
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

// ElevenLabs voice IDs by language
export const LANGUAGE_VOICES: Record<string, string> = {
  en: "JBFqnCBsd6RMkjVDRZzb", // Adam - English
  es: "pFZP5JQG7iQjIQuC4Bku", // Lily - Spanish
  pt: "jsCqWAovK2LkecY7zXl4", // Freya - Portuguese
  fr: "XB0fDUnXU5powFXDhCwa", // Charlotte - French
  de: "zcAOhNBS3c14rBihAFp1", // Hannah - German
  it: "bVMeCyTHy58xNoL34h3p", // Serena - Italian
  ja: "MF3mGyEYCl7XYWbV9V6O", // Elli - Japanese
  ko: "flq6f7yk4E4fJM5XTYuZ", // Michael - Korean
  zh: "XrExE9yKIg1WjnnlVkGX", // Lily - Chinese
  ar: "pqHfZKP75CvOlQylNhV4", // Bill - Arabic
};
