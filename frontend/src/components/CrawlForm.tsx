import React, { useState } from 'react';
import type { CrawledData } from '../types/crawl';

interface CrawlFormProps<TData> {
  onDataCrawled: (data: TData) => void;
  onImageSelect?: (url: string) => void;
}

function CrawlForm<TData extends CrawledData = CrawledData>({
  onDataCrawled,
  onImageSelect,
}: CrawlFormProps<TData>) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crawledData, setCrawledData] = useState<TData | null>(null);

  const asString = (value: unknown): string | null =>
    typeof value === 'string' && value.trim() ? value.trim() : null;

  const productName =
    asString(crawledData?.title) || asString((crawledData as any)?.name) || '상품명을 찾지 못했습니다';
  const productBrand = asString(crawledData?.brand) || '브랜드 정보 없음';
  const productUrl = asString(crawledData?.url) || 'URL 정보 없음';
  const productPrice =
    asString((crawledData as any)?.salePrice) ||
    asString((crawledData as any)?.price) ||
    asString((crawledData as any)?.originalPrice) ||
    '가격 정보 없음';

  const detailTexts = Array.isArray((crawledData as any)?.details)
    ? ((crawledData as any).details as Array<Record<string, unknown>>)
        .map(detail => asString(detail.text) || asString(detail.detailSub) || asString(detail.detailTitle))
        .filter(Boolean)
    : [];

  const mainDescription =
    asString(crawledData?.description) ||
    (detailTexts.length > 0 ? detailTexts[0] : '추출된 설명이 없습니다');

  const mainImages = Array.isArray((crawledData as any)?.mainImages)
    ? ((crawledData as any).mainImages as Array<unknown>)
        .map(img => asString(img))
        .filter(Boolean)
    : [];
  const mainImage = mainImages[0] || asString((crawledData as any)?.imageUrl);
  const detailImages = Array.isArray((crawledData as any)?.details)
    ? ((crawledData as any).details as Array<Record<string, unknown>>)
        .map(detail => asString(detail.image))
        .filter(Boolean)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setCrawledData(null);

    const apiBase =
      import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';

    try {
      const response = await fetch(`${apiBase}/api/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as TData;
      setCrawledData(result);
      onDataCrawled(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">1. Crawl Product</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Product URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://global.amoremall.com/..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Crawling...' : 'Start Crawling'}
          </button>
        </form>
        {error && <div className="mt-4 text-red-400 bg-red-900/20 p-3 rounded border border-red-900/50 text-sm">{error}</div>}
      </section>

      {/* Summary + Images + Raw Data stacked */}
      {crawledData && (
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-200">요약 보기</h2>
            <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">한국어 정리</span>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-200">
            <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700">
              <dt className="text-gray-400 text-xs mb-1">상품명</dt>
              <dd className="font-semibold text-white">{productName}</dd>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700">
              <dt className="text-gray-400 text-xs mb-1">브랜드</dt>
              <dd className="font-semibold text-white">{productBrand}</dd>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700">
              <dt className="text-gray-400 text-xs mb-1">가격</dt>
              <dd className="font-semibold text-white">{productPrice}</dd>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700 sm:col-span-2 break-all">
              <dt className="text-gray-400 text-xs mb-1">제품 URL</dt>
              <dd className="text-gray-100">{productUrl}</dd>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700 xl:col-span-2">
              <dt className="text-gray-400 text-xs mb-1">핵심 설명</dt>
              <dd className="text-gray-100">{mainDescription}</dd>
            </div>
          </dl>

          {(mainImage || detailImages.length > 0 || mainImages.length > 1) && (
            <div className="space-y-3">
              <h4 className="text-sm text-gray-300 font-semibold">이미지 미리보기</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {mainImages.map((src, idx) => (
                  <button
                    key={src || idx}
                    type="button"
                    onClick={() => onImageSelect?.(src as string)}
                    className="bg-gray-900/60 border border-gray-700 rounded-lg overflow-hidden text-left hover:border-emerald-500 transition-colors"
                  >
                    <img src={src as string} alt={`main-${idx + 1}`} className="w-full h-32 object-cover" />
                    <div className="text-xs text-gray-400 px-2 py-1 border-t border-gray-800">
                      대표 {idx + 1} (클릭해 브리프에 추가)
                    </div>
                  </button>
                ))}
                {!mainImages.length && mainImage && (
                  <button
                    type="button"
                    onClick={() => onImageSelect?.(mainImage)}
                    className="bg-gray-900/60 border border-gray-700 rounded-lg overflow-hidden text-left hover:border-emerald-500 transition-colors"
                  >
                    <img src={mainImage} alt="main" className="w-full h-32 object-cover" />
                    <div className="text-xs text-gray-400 px-2 py-1 border-t border-gray-800">대표 이미지 (클릭해 브리프에 추가)</div>
                  </button>
                )}
                {detailImages.map((src, idx) => (
                  <button
                    key={src || idx}
                    type="button"
                    onClick={() => onImageSelect?.(src as string)}
                    className="bg-gray-900/60 border border-gray-700 rounded-lg overflow-hidden text-left hover:border-emerald-500 transition-colors"
                  >
                    <img src={src as string} alt={`detail-${idx + 1}`} className="w-full h-32 object-cover" />
                    <div className="text-xs text-gray-400 px-2 py-1 border-t border-gray-800">상세 {idx + 1} (클릭해 브리프에 추가)</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-200">Crawled Data</h3>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">JSON</span>
            </div>
            <pre className="text-xs text-emerald-400 font-mono overflow-auto max-h-[400px] whitespace-pre-wrap scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {JSON.stringify(crawledData, null, 2)}
            </pre>
          </div>
        </section>
      )}
    </div>
  );
}

export default CrawlForm;
