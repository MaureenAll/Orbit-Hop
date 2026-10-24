import React, { useState } from 'react';
import { X, Smartphone, Globe, CheckCircle2, Copy, Check, Apple, Play } from 'lucide-react';

interface StorePublishGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorePublishGuide: React.FC<StorePublishGuideProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'google' | 'apple' | 'pwa'>('google');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b1329] border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-950/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              App Store Publishing Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 px-6 pt-3 bg-slate-900/40">
          <button
            onClick={() => setActiveTab('google')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'google'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            Google Play Store
          </button>
          <button
            onClick={() => setActiveTab('apple')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'apple'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Apple className="w-4 h-4 fill-current" />
            Apple App Store
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'pwa'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            Direct PWA Install
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {activeTab === 'google' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40">
                <h3 className="font-semibold text-cyan-300 text-base mb-1">
                  1-Click Package for Google Play (Trusted Web Activity)
                </h3>
                <p className="text-xs text-slate-400">
                  Because Orbit Hop is already built as a 100% compliant Progressive Web App, you can generate a signed Google Play <code className="text-cyan-300">.aab</code> bundle in under 5 minutes without writing native Java/Kotlin.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-white">Recommended Method A: PWABuilder (Fastest)</h4>
                <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed text-slate-300">
                  <li>Deploy Orbit Hop to your domain or GitHub Pages.</li>
                  <li>Visit <span className="text-cyan-400 font-mono">pwabuilder.com</span> and enter your URL.</li>
                  <li>Click <strong>Package for Stores</strong> &rarr; select <strong>Google Play</strong>.</li>
                  <li>Download the generated signed Android package (<code className="text-cyan-300">.aab</code>) and upload directly to Google Play Console.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-white">Recommended Method B: Bubblewrap CLI</h4>
                <p className="text-xs text-slate-400">Run Google's official CLI tool to generate the Android project locally:</p>
                <div className="relative group bg-slate-950 rounded-lg p-3 font-mono text-xs text-cyan-300 border border-slate-800">
                  <span>npm install -g @bubblewrap/cli && bubblewrap init --manifest=https://your-domain.com/manifest.webmanifest</span>
                  <button
                    onClick={() => copyCode('npm install -g @bubblewrap/cli && bubblewrap init --manifest=https://your-domain.com/manifest.webmanifest', 1)}
                    className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white"
                  >
                    {copiedIndex === 1 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'apple' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40">
                <h3 className="font-semibold text-indigo-300 text-base mb-1">
                  Packaging for Apple App Store (iOS)
                </h3>
                <p className="text-xs text-slate-400">
                  Apple requires an Xcode wrapper for App Store submission. Orbit Hop's decoupled Canvas engine is 100% compatible with Capacitor for native iOS performance.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-white">Step-by-step Capacitor Setup:</h4>
                <div className="relative group bg-slate-950 rounded-lg p-3 font-mono text-xs text-indigo-300 border border-slate-800 space-y-1">
                  <p>npm install @capacitor/core @capacitor/cli @capacitor/ios</p>
                  <p>npx cap init &quot;Orbit Hop&quot; com.orbithop.game</p>
                  <p>npm run build</p>
                  <p>npx cap add ios</p>
                  <p>npx cap open ios</p>
                  <button
                    onClick={() => copyCode('npm install @capacitor/core @capacitor/cli @capacitor/ios\nnpx cap init "Orbit Hop" com.orbithop.game\nnpm run build\nnpx cap add ios\nnpx cap open ios', 2)}
                    className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white"
                  >
                    {copiedIndex === 2 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  This opens the generated project in Xcode. In Xcode, connect your Apple Developer Account and click <strong>Product &rarr; Archive &rarr; Distribute App</strong> to upload to App Store Connect.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
                <h3 className="font-semibold text-emerald-300 text-base mb-1">
                  Instant Mobile Install (No Store Wait)
                </h3>
                <p className="text-xs text-slate-400">
                  Players can immediately install Orbit Hop directly onto their home screen right now as a standalone full-screen app!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Android & Chrome
                  </div>
                  <p className="text-slate-400">
                    Click the <strong>Install App</strong> button on the title screen or browser address bar to install instantly.
                  </p>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> iPhone & iPad (Safari)
                  </div>
                  <p className="text-slate-400">
                    Tap the <strong>Share</strong> button at bottom &rarr; tap <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
