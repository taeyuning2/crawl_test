import React, { useMemo, useState } from 'react';
import type { CrawledData } from '../types/crawl';

interface VideoPromptGeneratorProps {
  crawledData: CrawledData | null;
  referenceImage?: string;
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
  price: string;
  description: string;
  videoType: 'A' | 'B' | 'C' | 'D' | 'E';
  scriptStyle: '1' | '2' | '3' | '4' | '5' | '6';
  referenceImage: string;
};

const defaultFormState: FormState = {
  productUrl: '',
  productName: '',
  brand: '',
  price: '',
  description: '',
  target: '20-30 female',
  tone: 'Modern · Clean · Minimal',
  length: '15s',
  ratio: '9:16 (vertical)',
  cta: 'Shop now',
  keyPoints: '',
  videoType: 'A',
  scriptStyle: '1',
  referenceImage: '',
};

const videoTypeGuide: Record<FormState['videoType'], string> = {
  A: 'A타입｜키 비주얼 강조형 (3초 내 주목, 메시지 한 줄)',
  B: 'B타입｜효능 서사형 (AIDA 균형)',
  C: 'C타입｜제품 핵심 설명형 (정보 전달 중심)',
  D: 'D타입｜AI 가이드 설명형 (신뢰/현실감)',
  E: 'E타입｜프로모션 조건 설명형 (혜택·조건 명확히)',
};

const scriptStyleGuide: Record<FormState['scriptStyle'], string> = {
  '1': 'USP 원라이너형: 차별점 한 줄 + 근거',
  '2': '기능-근거 스택형: Feature→Benefit 2~3줄 + CTA',
  '3': '문제-해결 전환형(PAS): 문제-공감-해결-CTA',
  '4': '신뢰-검증형: 수치/테스트 근거 2문장 + Benefit + CTA',
  '5': '아이덴티티-무드형: 감성/무드 3문장, 기능 1문장',
  '6': '오퍼-행동 유도형: 혜택→조건→추가혜택→CTA',
};

const VideoPromptGenerator: React.FC<VideoPromptGeneratorProps> = ({ crawledData, referenceImage }) => {
  const [step, setStep] = useState<'briefing' | 'result'>('briefing');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoStatus, setVideoStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [videoOutput, setVideoOutput] = useState<Record<string, unknown> | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const baseKey = crawledData?.url ?? 'default';

  const baseForm = useMemo<FormState>(() => ({
    ...defaultFormState,
    productUrl: crawledData?.url ?? defaultFormState.productUrl,
    productName: crawledData?.title ?? defaultFormState.productName,
    brand: crawledData?.brand ?? defaultFormState.brand,
    price:
      (crawledData as any)?.salePrice ||
      (crawledData as any)?.price ||
      (crawledData as any)?.originalPrice ||
      defaultFormState.price,
    description: crawledData?.description ?? defaultFormState.description,
    keyPoints: crawledData?.description ? `${crawledData.description.slice(0, 200)}...` : defaultFormState.keyPoints,
    cta: crawledData ? 'Shop now via the link below' : defaultFormState.cta,
    videoType: defaultFormState.videoType,
    scriptStyle: defaultFormState.scriptStyle,
    referenceImage: referenceImage || (crawledData as any)?.referenceImage || (crawledData as any)?.imageUrl || defaultFormState.referenceImage,
  }), [crawledData, referenceImage]);

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
        ...(name === 'videoType' && value === 'E' ? { scriptStyle: '6' } : {}),
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

  const handleGenerateVideo = async () => {
    const apiBase =
      import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
    const durationSec = parseInt(formData.length, 10) || 10;
    const aspectRatio = formData.ratio.split(' ')[0];
    const prompt = [
      `${formData.brand} ${formData.productName}`.trim(),
      formData.price ? `Price: ${formData.price}` : '',
      formData.keyPoints || formData.description || '',
      `Video type: ${formData.videoType} (${videoTypeGuide[formData.videoType]})`,
      `Script style: ${formData.scriptStyle} (${scriptStyleGuide[formData.scriptStyle]})`,
      formData.videoType === 'E'
        ? 'E타입 규칙: 단일 장면, AI 안내자 하단 작은 배치, 감성/과장 금지, 오퍼-행동 유도형만 사용, 조건은 A(혜택 요약)->I(금액/혜택/코드/기간 정렬)->조건 3개 이상이면 Step 분리->Desire 1문장(즉각성 가볍게)->Action 1문장 CTA. 모호한 표현 금지.'
        : '',
      `Tone: ${formData.tone}`,
      `CTA: ${formData.cta}`,
      `Duration: ${formData.length}`,
      `Aspect: ${formData.ratio}`,
      formData.referenceImage ? `Reference image: ${formData.referenceImage}` : '',
      formData.productUrl ? `Link: ${formData.productUrl}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      setVideoStatus('loading');
      setVideoError(null);
      setVideoOutput(null);

      const res = await fetch(`${apiBase}/api/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, durationSec, aspectRatio }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Video API failed (${res.status})`);
      }

      const data = (await res.json()) as Record<string, unknown>;
      setVideoOutput(data);
      setVideoStatus('done');
    } catch (err) {
      setVideoStatus('error');
      setVideoError(err instanceof Error ? err.message : '영상 생성 요청 실패');
    }
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
                      <label className="block text-xs text-gray-400 mb-1">Price</label>
                      <input
                        type="text"
                        name="price"
                        value={formData.price}
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

                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Reference image URL (click a thumbnail on the left)</label>
                      <input
                        type="text"
                        name="referenceImage"
                        value={formData.referenceImage}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="https://..."
                      />
                      <p className="text-[11px] text-gray-500 mt-1">썸네일을 클릭하면 자동으로 채워집니다.</p>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Video type</label>
                      <select
                        name="videoType"
                        value={formData.videoType}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-300"
                      >
                        <option value="A">A타입｜키 비주얼 강조</option>
                        <option value="B">B타입｜효능 서사형</option>
                        <option value="C">C타입｜제품 핵심 설명</option>
                        <option value="D">D타입｜AI 가이드 설명</option>
                        <option value="E">E타입｜프로모션 설명</option>
                      </select>
                      <p className="text-[11px] text-gray-500 mt-1">{videoTypeGuide[formData.videoType]}</p>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Script style</label>
                      <select
                        name="scriptStyle"
                        value={formData.scriptStyle}
                        onChange={handleInputChange}
                        disabled={formData.videoType === 'E'}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-300"
                      >
                        <option value="1">1) USP 원라이너형</option>
                        <option value="2">2) 기능-근거 스택형</option>
                        <option value="3">3) 문제-해결 전환형 (PAS)</option>
                        <option value="4">4) 신뢰-검증형</option>
                        <option value="5">5) 아이덴티티-무드형</option>
                        <option value="6">6) 오퍼-행동 유도형</option>
                      </select>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {formData.videoType === 'E'
                          ? 'E타입은 6) 오퍼-행동 유도형만 사용합니다.'
                          : scriptStyleGuide[formData.scriptStyle]}
                      </p>
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

            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 backdrop-blur-sm animate-fade-in">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">Video generation (Veo)</h3>
                <button
                  onClick={() => setStep('briefing')}
                  className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300 transition-colors"
                >
                  Edit briefing
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                아래 프롬프트로 Veo API를 호출해 영상을 생성합니다. (유료 모델이므로 호출 시 과금될 수 있습니다.)
              </p>
              <div className="space-y-3">
                <div className="text-xs bg-gray-900/60 border border-gray-700 rounded-lg p-3 text-gray-100">
                  {[
                    `${formData.brand} ${formData.productName}`.trim(),
                    formData.price ? `Price: ${formData.price}` : '',
                    formData.keyPoints || formData.description || '',
                    `Tone: ${formData.tone}`,
                    `CTA: ${formData.cta}`,
                    `Duration: ${formData.length}`,
                    `Aspect: ${formData.ratio}`,
                    formData.productUrl ? `Link: ${formData.productUrl}` : '',
                  ]
                    .filter(Boolean)
                    .join(' | ')}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGenerateVideo}
                    disabled={videoStatus === 'loading'}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {videoStatus === 'loading' ? 'Generating...' : 'Generate video'}
                  </button>
                  <span className="text-xs text-gray-400">
                    상태: {videoStatus === 'idle' ? '대기' : videoStatus === 'loading' ? '생성 중' : videoStatus === 'done' ? '완료' : '오류'}
                  </span>
                </div>
                {videoError && (
                  <div className="text-xs text-red-400 bg-red-900/30 border border-red-800 rounded p-2">{videoError}</div>
                )}
                {videoOutput && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-200">Veo 응답</h4>
                    {'videoUrl' in videoOutput && typeof videoOutput.videoUrl === 'string' ? (
                      <a
                        href={videoOutput.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 underline text-sm"
                      >
                        영상 보기
                      </a>
                    ) : (
                      <pre className="text-xs text-emerald-400 bg-gray-900/60 border border-gray-700 rounded-lg p-3 overflow-auto">
                        {JSON.stringify(videoOutput, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
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
