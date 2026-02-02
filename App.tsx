
import React, { useState, useEffect, useCallback } from 'react';
import { generate3DIcon, generateAnimatedIcon } from './services/gemini';
import { GeneratedIcon, AspectRatio, ImageSize, VideoResolution, IconType } from './types';
import { 
  Sparkles, 
  History, 
  Settings, 
  Download, 
  Trash2, 
  Loader2, 
  Zap, 
  Monitor,
  Layout,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Video,
  Image as ImageIcon,
  Play,
  RefreshCw
} from 'lucide-react';

// Fix: Define AIStudio interface to match the existing global type expectation and use 'readonly' modifier
// to satisfy TypeScript requirements for consistent global declarations.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    readonly aistudio: AIStudio;
  }
}

const DEFAULT_IMAGE_PROMPT = "A 3D icon of an artificial intelligence brain made of interconnected glowing nodes and circuit lines, symbolizing machine intelligence and learning. In a high-quality modern 3D icon style, smooth rounded geometry, soft shadows, subtle reflections, clean studio lighting, soft gradient color palette (blue, purple, cyan), futuristic but friendly, floating icon, centered composition, no text, no watermark, isolated on a transparent or light neutral background, designed for UI, SaaS dashboards, Notion, and digital products";

const DEFAULT_VIDEO_PROMPT = "Animate the 3D icon of an artificial intelligence brain. Make the interconnected nodes gently pulse with light and have the circuit lines subtly flow, symbolizing active processing and learning. The animation should be smooth, low-looping, and suitable for a UI element on a transparent background. High quality 3D render, studio lighting, soft blue and purple gradients.";

export default function App() {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState(true);
  const [prompt, setPrompt] = useState(DEFAULT_IMAGE_PROMPT);
  const [iconType, setIconType] = useState<IconType>('image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedIcon[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.K1);
  const [videoResolution, setVideoResolution] = useState<VideoResolution>(VideoResolution.HD);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  useEffect(() => {
    const saved = localStorage.getItem('iconic_ai_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    
    const checkKey = async () => {
      try {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } catch (e) {
        console.error("Error checking key", e);
      } finally {
        setCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    localStorage.setItem('iconic_ai_history', JSON.stringify(history));
  }, [history]);

  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    } catch (e) {
      setError("Failed to open key selection dialog.");
    }
  };

  const handleToggleType = (type: IconType) => {
    setIconType(type);
    if (type === 'video' && prompt === DEFAULT_IMAGE_PROMPT) {
      setPrompt(DEFAULT_VIDEO_PROMPT);
    } else if (type === 'image' && prompt === DEFAULT_VIDEO_PROMPT) {
      setPrompt(DEFAULT_IMAGE_PROMPT);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGenStatus('Waking up Gemini...');

    try {
      let url = '';
      if (iconType === 'image') {
        url = await generate3DIcon(prompt, { aspectRatio, imageSize });
      } else {
        const videoRatio = aspectRatio === AspectRatio.PORTRAIT_TALL || aspectRatio === AspectRatio.PORTRAIT_SHORT ? '9:16' : '16:9';
        url = await generateAnimatedIcon(prompt, { aspectRatio: videoRatio, resolution: videoResolution }, setGenStatus);
      }

      const newIcon: GeneratedIcon = {
        id: crypto.randomUUID(),
        url,
        type: iconType,
        prompt,
        timestamp: Date.now(),
        config: { 
          aspectRatio, 
          imageSize: iconType === 'image' ? imageSize : undefined,
          resolution: iconType === 'video' ? videoResolution : undefined
        }
      };
      setHistory(prev => [newIcon, ...prev]);
      setActiveTab('generate');
    } catch (err: any) {
      if (err.message === "API_KEY_ERROR") {
        setHasKey(false);
        setError("API Key verification failed. Please re-select a paid project key.");
      } else {
        setError(err.message || "An unexpected error occurred during generation.");
      }
    } finally {
      setIsGenerating(false);
      setGenStatus('');
    }
  };

  const deleteFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const downloadAsset = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (checkingKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-md w-full glass-panel rounded-3xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold">Premium AI Required</h1>
          <p className="text-slate-400">
            IconicAI uses <span className="text-blue-400 font-semibold">Gemini 3 Pro</span> and <span className="text-indigo-400 font-semibold">Veo</span> for professional 3D assets.
            Select a billing-enabled API key to proceed.
          </p>
          <div className="bg-slate-800/50 p-4 rounded-xl text-left text-sm space-y-2 border border-slate-700">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> High Resolution Images (4K)
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cinematic AI Animation (Veo)
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Professional UI Assets
            </p>
          </div>
          <button 
            onClick={handleSelectKey}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
          >
            Connect AI Studio
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 underline"
          >
            Learn about billing <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  const latestIcon = history[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a]">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Iconic<span className="gradient-text">AI</span></h1>
        </div>

        <nav className="flex bg-slate-800/80 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'generate' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Studio
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Archive ({history.length})
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {activeTab === 'generate' ? (
          <>
            {/* Control Panel */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-panel p-6 rounded-3xl space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">Asset Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleToggleType('image')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${iconType === 'image' ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                    >
                      <ImageIcon className="w-4 h-4" /> Static Icon
                    </button>
                    <button 
                      onClick={() => handleToggleType('video')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${iconType === 'video' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                    >
                      <Video className="w-4 h-4" /> Animated Icon
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Prompt</label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your 3D icon..."
                    className="w-full h-40 bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Format</label>
                    <select 
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-sm focus:outline-none"
                    >
                      <option value={AspectRatio.SQUARE}>Square (1:1)</option>
                      <option value={AspectRatio.LANDSCAPE_WIDE}>Wide (16:9)</option>
                      <option value={AspectRatio.PORTRAIT_TALL}>Tall (9:16)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Quality</label>
                    {iconType === 'image' ? (
                      <select 
                        value={imageSize}
                        onChange={(e) => setImageSize(e.target.value as ImageSize)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-sm focus:outline-none"
                      >
                        <option value={ImageSize.K1}>1K Standard</option>
                        <option value={ImageSize.K2}>2K Sharp</option>
                        <option value={ImageSize.K4}>4K Ultra</option>
                      </select>
                    ) : (
                      <select 
                        value={videoResolution}
                        onChange={(e) => setVideoResolution(e.target.value as VideoResolution)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-sm focus:outline-none"
                      >
                        <option value={VideoResolution.HD}>720p Fast</option>
                        <option value={VideoResolution.FHD}>1080p High</option>
                      </select>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{genStatus || 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      {iconType === 'image' ? <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                      <span>Generate {iconType === 'image' ? 'Static' : 'Animated'} Icon</span>
                    </>
                  )}
                </button>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </div>

              {iconType === 'video' && (
                <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex gap-3 text-amber-200/70 text-xs leading-relaxed">
                  <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p>Note: AI Video generation (Veo) is computationally intensive and takes approximately 60-120 seconds. Please keep the window active.</p>
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-7">
              <div className="glass-panel rounded-3xl p-4 h-full flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
                {isGenerating ? (
                  <div className="text-center space-y-4 animate-pulse">
                    <div className="w-64 h-64 bg-slate-800 rounded-3xl mx-auto flex items-center justify-center">
                      <RefreshCw className="w-12 h-12 text-blue-500/20 animate-spin" />
                    </div>
                    <p className="text-slate-500 font-medium">Developing your 3D assets...</p>
                  </div>
                ) : latestIcon ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                    <div className="relative group max-w-md w-full animate-float">
                      <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-[40px] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-white/5">
                        {latestIcon.type === 'image' ? (
                          <img 
                            src={latestIcon.url} 
                            alt="Generated Icon" 
                            className="w-full h-auto"
                          />
                        ) : (
                          <video 
                            src={latestIcon.url} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            className="w-full h-auto"
                          />
                        )}
                      </div>
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <button 
                          onClick={() => downloadAsset(latestIcon.url, `iconic-ai-${latestIcon.id}.${latestIcon.type === 'image' ? 'png' : 'mp4'}`)}
                          className="p-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl hover:bg-white/20 transition-all text-white"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-1">Latest Generation</h3>
                      <p className="text-sm text-slate-500 max-w-sm mx-auto line-clamp-2 italic">
                        "{latestIcon.prompt}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-700">
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400">Ready to Visualize</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">
                      Adjust settings and prompt above to generate your first professional 3D {iconType} asset.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* History View */
          <div className="lg:col-span-12 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Generation Archive</h2>
                <p className="text-slate-500">Your collection of high-fidelity 3D assets</p>
              </div>
              <button 
                onClick={() => {
                  if(confirm("Clear all history?")) setHistory([]);
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            </div>

            {history.length === 0 ? (
              <div className="glass-panel rounded-3xl p-12 text-center">
                <p className="text-slate-500 italic">No assets generated yet.</p>
                <button 
                  onClick={() => setActiveTab('generate')}
                  className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
                >
                  Create your first icon →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {history.map((icon) => (
                  <div key={icon.id} className="glass-panel group rounded-3xl overflow-hidden border border-white/5 hover:border-blue-500/30 transition-all flex flex-col">
                    <div className="aspect-square relative overflow-hidden bg-slate-900">
                      {icon.type === 'image' ? (
                        <img src={icon.url} className="w-full h-full object-cover" />
                      ) : (
                        <video src={icon.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      )}
                      
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => downloadAsset(icon.url, `iconic-ai-${icon.id}.${icon.type === 'image' ? 'png' : 'mp4'}`)}
                          className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-white hover:bg-black/70"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteFromHistory(icon.id)}
                          className="p-2 bg-red-500/50 backdrop-blur-md rounded-lg text-white hover:bg-red-500/70"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="absolute top-3 left-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${icon.type === 'image' ? 'bg-blue-500 text-white' : 'bg-indigo-500 text-white'}`}>
                          {icon.type}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {icon.prompt}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 pt-3 border-t border-white/5">
                        <span>{new Date(icon.timestamp).toLocaleDateString()}</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded uppercase">{icon.config.aspectRatio}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-white/5 text-center">
        <p className="text-slate-600 text-xs">
          Powered by Gemini 3 Pro & Veo &bull; Built for High-Performance Digital Products
        </p>
      </footer>
    </div>
  );
}
