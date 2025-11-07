import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "../locales/en/translation.json";
import koTranslation from "../locales/ko/translation.json";

const resources = {
  en: {
    translation: enTranslation,
  },
  ko: {
    translation: koTranslation,
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
];

export default i18n;


