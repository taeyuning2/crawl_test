import React, { useState } from 'react';
import type { CrawledData } from '../types/crawl';

interface CrawlFormProps<TData> {
  onDataCrawled: (data: TData) => void;
}

const CrawlForm = <TData extends CrawledData = CrawledData>({ onDataCrawled }: CrawlFormProps<TData>) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crawledData, setCrawledData] = useState<TData | null>(null);

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

      {/* Raw Data View */}
      {crawledData && (
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex-1 min-h-0 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Crawled Data</h2>
            <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">JSON</span>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-hidden flex-1">
            <pre className="text-xs text-emerald-400 font-mono overflow-auto max-h-[600px] whitespace-pre-wrap scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {JSON.stringify(crawledData, null, 2)}
            </pre>
          </div>
        </section>
      )}
    </div>
  );
};

export default CrawlForm;
