import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { CICDStatusModal } from "../components/CICDStatusModal";

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100 dark:from-sky-950 dark:via-sky-900 dark:to-sky-800 flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-white/10 bg-white/30 dark:bg-black/20 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-wider text-slate-900 dark:text-white">Deploy Land</h1>
          <nav className="flex items-center gap-4 text-slate-700 dark:text-slate-200 text-sm">
            <Link to="/game" className="hover:underline">Play</Link>
            <a href="#features" className="hover:underline">Features</a>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 text-center flex-1 flex items-center justify-center">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-6xl md:text-8xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow">
            Deploy Land
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            시각화된 게임으로 배포 파이프라인을 추적하고 모니터링하세요
          </p>

          {/* Features */}
          <div id="features" className="grid md:grid-cols-3 gap-6 mt-12 mb-12">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="text-4xl mb-4">🏗️</div>
              <h3 className="text-xl font-semibold text-white mb-2">Build</h3>
              <p className="text-gray-400">
                코드 빌드 상태를 실시간으로 추적
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="text-4xl mb-4">🧪</div>
              <h3 className="text-xl font-semibold text-white mb-2">Test</h3>
              <p className="text-gray-400">
                테스트 실행 결과를 시각적으로 확인
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-2">Deploy</h3>
              <p className="text-gray-400">
                배포 프로세스를 게임으로 시각화
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
                시작하기
              </Button>
            </Link>
            
            <CICDStatusModal />
          </div>

          {/* Additional Info */}
          <div className="mt-16 pt-8 border-t border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              파이프라인 상태를 실시간으로 모니터링하고, 성공과 실패를 게임으로 경험하세요
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

