import React, { useMemo, useState } from 'react';
import type { CrawledData } from '../types/crawl';

interface VideoPromptGeneratorProps {
  crawledData: CrawledData | null;
}

type FormState = {
  productUrl: string;
  productName: string;
  brand: string;
  target: string;
  tone: string;
  length: string;
  ratio: string;
  cta: string;
  keyPoints: string;
};

const defaultFormState: FormState = {
  productUrl: '',
  productName: '',
  brand: '',
  target: '20-30 female',
  tone: 'Modern · Clean · Minimal',
  length: '15s',
  ratio: '9:16 (vertical)',
  cta: 'Shop now',
  keyPoints: '',
};

const VideoPromptGenerator: React.FC<VideoPromptGeneratorProps> = ({ crawledData }) => {
  const [step, setStep] = useState<'briefing' | 'result'>('briefing');
  const [isGenerating, setIsGenerating] = useState(false);
  const baseKey = crawledData?.url ?? 'default';

  const baseForm = useMemo<FormState>(() => ({
    ...defaultFormState,
    productUrl: crawledData?.url ?? defaultFormState.productUrl,
    productName: crawledData?.title ?? defaultFormState.productName,
    brand: crawledData?.brand ?? defaultFormState.brand,
    keyPoints: crawledData?.description ? `${crawledData.description.slice(0, 200)}...` : defaultFormState.keyPoints,
    cta: crawledData ? 'Shop now via the link below' : defaultFormState.cta,
  }), [crawledData]);

  const [overridesByKey, setOverridesByKey] = useState<Record<string, Partial<FormState>>>({});

  const formData = useMemo<FormState>(() => ({
    ...baseForm,
    ...(overridesByKey[baseKey] ?? {}),
  }), [baseForm, overridesByKey, baseKey]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOverridesByKey(prev => ({
      ...prev,
      [baseKey]: {
        ...(prev[baseKey] ?? {}),
        [name]: value,
      },
    }));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setStep('result');
      setIsGenerating(false);
    }, 1500);
  };

  const handleReset = () => {
    setStep('briefing');
    setOverridesByKey(prev => ({
      ...prev,
      [baseKey]: {},
    }));
  };

  return (
    <div className="w-full p-6 bg-[#0f172a] text-white rounded-xl shadow-2xl font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/30">
            Agent 08
          </span>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Video Prompt Builder
          </h2>
        </div>
        <div className="flex gap-2 text-xs text-gray-400">
          <span className="px-3 py-1 bg-gray-800 rounded-full border border-gray-700">Goal: 5~15s short-form</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Step 1: Briefing Mode */}
        {step === 'briefing' && (
          <>
            {/* Left Column: Input / Briefing */}
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Product Brief
                  <div className="h-px flex-1 bg-gray-700 ml-4"></div>
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Product URL (source)</label>
                      <input
                        type="text"
                        name="productUrl"
                        value={formData.productUrl}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Product name</label>
                      <input
                        type="text"
                        name="productName"
                        value={formData.productName}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Brand</label>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Target audience</label>
                      <input
                        type="text"
                        name="target"
                        value={formData.target}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Tone & mood</label>
                      <select
                        name="tone"
                        value={formData.tone}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-300"
                      >
                        <option>Modern · Clean · Minimal</option>
                        <option>Bright · Energetic · Friendly</option>
                        <option>Warm · Calm · Human</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Duration</label>
                      <select
                        name="length"
                        value={formData.length}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-300"
                      >
                        <option>5s</option>
                        <option>10s</option>
                        <option>15s</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Ratio</label>
                      <select
                        name="ratio"
                        value={formData.ratio}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-300"
                      >
                        <option>9:16 (vertical)</option>
                        <option>16:9 (horizontal)</option>
                        <option>1:1 (square)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">CTA</label>
                      <input
                        type="text"
                        name="cta"
                        value={formData.cta}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Key points</label>
                      <textarea
                        name="keyPoints"
                        value={formData.keyPoints}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold py-3 px-6 rounded-lg shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        'Generate storyboard'
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                  <p className="text-xs text-emerald-400/80 mt-2">
                    This agent drafts AI-ready prompts and outputs JSON for downstream video tools.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Workflow Info */}
            <div className="space-y-6 animate-fade-in delay-100">
              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50">
                <h3 className="text-lg font-semibold mb-4 text-gray-200">Workflow</h3>

                <div className="space-y-6 relative">
                  {/* Vertical Line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-700"></div>

                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                    <h4 className="text-emerald-400 font-medium mb-1">1) Ingest & scrape</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Pull product meta, description, and assets to seed the prompt.
                    </p>
                  </div>

                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    </div>
                    <h4 className="text-gray-300 font-medium mb-1">2) Select generator</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Target free/hosted text-to-video services or your own pipeline.
                    </p>
                  </div>

                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    </div>
                    <h4 className="text-gray-300 font-medium mb-1">3) Edit & deliver</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Combine cuts, overlays, and music; export final clips for social.
                    </p>
                  </div>

                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    </div>
                    <h4 className="text-gray-300 font-medium mb-1">4) Share</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Distribute via drive/notion with links back to the product page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Result Mode */}
        {step === 'result' && (
          <>
            {/* Script / Narration */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 backdrop-blur-sm h-fit animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">Script draft</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('briefing')}
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300 transition-colors"
                  >
                    Edit briefing
                  </button>
                  <button className="text-xs bg-emerald-600 hover:bg-emerald-500 px-2 py-1 rounded text-white transition-colors">
                    Copy
                  </button>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-300 font-mono bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <p>
                  <span className="text-emerald-400">[Hook]</span> {formData.brand} {formData.productName}, {formData.tone} visuals.
                </p>
                <p>
                  <span className="text-emerald-400">[Problem]</span> Highlight the audience ({formData.target}) pain point in one line.
                </p>
                <p>
                  <span className="text-emerald-400">[Value]</span> {formData.keyPoints || 'Key benefit goes here.'}
                </p>
                <p>
                  <span className="text-emerald-400">[CTA]</span> {formData.cta} · {formData.productUrl}
                </p>
              </div>
            </div>

            {/* Storyboard / Prompt */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 backdrop-blur-sm animate-fade-in delay-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">Storyboard & prompt</h3>
                <div className="flex gap-2">
                  <button className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300 transition-colors">Copy prompt</button>
                  <button className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300 transition-colors">Copy JSON</button>
                </div>
              </div>

              <div className="space-y-6 text-sm">
                <div className="space-y-2">
                  <h4 className="text-emerald-400 font-medium"># Hook / Hero (0-4s)</h4>
                  <div className="bg-gray-900/50 p-3 rounded border border-gray-700/50">
                    <p className="text-gray-300 mb-1">
                      <span className="text-gray-500">- Prompt:</span> {formData.productName} product close-up, {formData.tone}, studio lighting, particles,
                      cinematic, {formData.ratio}
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-500">- Overlay:</span> Product name + brand logo
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-emerald-400 font-medium"># Problem & Need (4-8s)</h4>
                  <div className="bg-gray-900/50 p-3 rounded border border-gray-700/50">
                    <p className="text-gray-300 mb-1">
                      <span className="text-gray-500">- Prompt:</span> Everyday scene showing the audience challenge, natural lighting, lifestyle, {formData.ratio}
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-500">- Overlay:</span> Pain point question
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-emerald-400 font-medium"># Solution Demo (8-16s)</h4>
                  <div className="bg-gray-900/50 p-3 rounded border border-gray-700/50">
                    <p className="text-gray-300 mb-1">
                      <span className="text-gray-500">- Prompt:</span> Product in use, macro texture, smooth camera move, premium look
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-500">- Overlay:</span> {formData.keyPoints || 'Top 3 benefits'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-emerald-400 font-medium"># Call to Action (last 3s)</h4>
                  <div className="bg-gray-900/50 p-3 rounded border border-gray-700/50">
                    <p className="text-gray-300 mb-1">
                      <span className="text-gray-500">- Prompt:</span> Product pack shot with sleek UI overlay, depth of field, premium mood
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-500">- Overlay:</span> {formData.cta}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700">
                  <h4 className="text-gray-400 font-medium mb-2 text-xs">JSON (for AI export)</h4>
                  <pre className="bg-black/30 p-3 rounded text-xs text-gray-500 overflow-x-auto font-mono">
{`{
  "meta": {
    "productUrl": "${formData.productUrl}",
    "duration": "${formData.length}"
  },
  "cta": "${formData.cta}"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoPromptGenerator;
