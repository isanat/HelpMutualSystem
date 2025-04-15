// Arquivo: src/components/I18nProvider.tsx

"use client";

import { ReactNode, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";

export default function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    const browserLanguage = navigator.language.split("-")[0];
    const defaultLanguage = savedLanguage || browserLanguage || "en";
    i18n.changeLanguage(defaultLanguage);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}