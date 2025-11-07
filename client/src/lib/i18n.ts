import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "../locales/en/translation.json";
import koTranslation from "../locales/ko/translation.json";
import jpTranslation from "../locales/jp/translation.json";

const resources = {
  en: {
    translation: enTranslation,
  },
  ko: {
    translation: koTranslation,
  },
  jp: {
    translation: jpTranslation,
  },
} as const;

const DEFAULT_LANGUAGE = "ko";

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export const supportedLanguages = [
  { code: "ko", labelKey: "language.korean" },
  { code: "en", labelKey: "language.english" },
  { code: "jp", labelKey: "language.japanese" },
];

export default i18n;


