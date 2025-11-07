import { useTranslation } from "react-i18next";
import { supportedLanguages } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();

  return (
    <Select
      defaultValue={i18n.language}
      onValueChange={(value) => {
        void i18n.changeLanguage(value);
      }}
    >
      <SelectTrigger className="w-[140px] bg-white/60 text-xs font-medium uppercase tracking-wide text-slate-700 dark:bg-black/40 dark:text-slate-200">
        <SelectValue placeholder={t("language.label") as string} />
      </SelectTrigger>
      <SelectContent>
        {supportedLanguages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code} className="text-xs">
            {t(lang.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


