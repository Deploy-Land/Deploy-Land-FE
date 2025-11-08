import { useTranslation } from "react-i18next";
import { supportedLanguages } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  
  // 현재 선택된 언어의 네이티브 이름 찾기
  const currentLang = supportedLanguages.find((lang) => lang.code === i18n.language);
  const currentLabel = currentLang?.nativeName || t("language.label");

  return (
    <Select
      value={i18n.language}
      onValueChange={(value) => {
        void i18n.changeLanguage(value);
      }}
    >
      <SelectTrigger className="w-[140px] bg-white/60 text-xs font-medium uppercase tracking-wide text-slate-700 dark:bg-black/40 dark:text-slate-200">
        <SelectValue>{currentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {supportedLanguages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code} className="text-xs">
            {lang.nativeName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


