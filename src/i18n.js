import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ko from "./locales/ko.json";
import it from "./locales/italy.json";

i18n
    .use(initReactI18next)
    .use(LanguageDetector) // 브라우저 언어 감지
    .init({
        resources: {
            en: { translation: en },
            ko: { translation: ko },
            it: { translation: it },
        },
        fallbackLng: "ko", // 기본 언어
        interpolation: { escapeValue: false },
    });

// ✅ 한국어(ko)가 아니면 자동으로 영어(en)로 변경
if (i18n.language !== "ko") {
    i18n.changeLanguage("en");
}

export default i18n;
