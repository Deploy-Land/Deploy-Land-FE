import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { CICDStatusModal } from "../components/CICDStatusModal";
import { LanguageToggle } from "../components/LanguageToggle";

export function Landing() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100 dark:from-sky-950 dark:via-sky-900 dark:to-sky-800 flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-white/10 bg-white/30 dark:bg-black/20 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-wider text-slate-900 dark:text-white">{t("app.name")}</h1>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4 text-slate-700 dark:text-slate-200 text-sm">
              <Link to="/game" className="hover:underline">{t("navigation.play")}</Link>
              <a href="#features" className="hover:underline">{t("navigation.features")}</a>
            </nav>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 text-center flex-1 flex items-center justify-center">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-6xl md:text-8xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow">
            {t("landing.heroTitle")}
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-900 dark:text-slate-200 mb-8 max-w-2xl mx-auto">
            {t("landing.heroSubtitle")}
          </p>

          {/* Features */}
          <div id="features" className="grid md:grid-cols-3 gap-6 mt-12 mb-12">
            <div className="bg-white/80 text-slate-900 dark:bg-gray-800/60 dark:text-slate-100 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🏗️</div>
              <h3 className="text-xl font-semibold mb-2">{t("landing.buildTitle")}</h3>
              <p className="text-sm md:text-base">
                {t("landing.buildDescription")}
              </p>
            </div>
            
            <div className="bg-white/80 text-slate-900 dark:bg-gray-800/60 dark:text-slate-100 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🧪</div>
              <h3 className="text-xl font-semibold mb-2">{t("landing.testTitle")}</h3>
              <p className="text-sm md:text-base">
                {t("landing.testDescription")}
              </p>
            </div>
            
            <div className="bg-white/80 text-slate-900 dark:bg-gray-800/60 dark:text-slate-100 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">{t("landing.deployTitle")}</h3>
              <p className="text-sm md:text-base">
                {t("landing.deployDescription")}
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Link to="/game">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {t("landing.ctaStart")}
              </Button>
            </Link>
            
            <CICDStatusModal />
          </div>

          {/* Additional Info */}
          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-slate-900 dark:text-slate-200 text-sm">
              {t("landing.footerNote")}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-white/30 dark:bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
          <span>© {new Date().getFullYear()} Deploy Land</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

