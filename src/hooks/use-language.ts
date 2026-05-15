import { useEffect, useState } from "react";

export type Lang = "en" | "it";

const KEY = "lang";

export function useLanguage(initial: Lang = "en"): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(initial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(KEY) as Lang | null;
    if (saved === "en" || saved === "it") {
      setLangState(saved);
      return;
    }
    const navLang = navigator.language?.toLowerCase().startsWith("it") ? "it" : "en";
    setLangState(navLang);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, lang);
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  return [lang, setLangState];
}
