import { useState } from 'react';
import './App.css';
import VideoPromptGenerator from './components/VideoPromptGenerator';
import CrawlForm from './components/CrawlForm';
import type { CrawledData } from './types/crawl';

function App() {
  const [data, setData] = useState<CrawledData | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="w-full mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            Product Crawler & Video Agent
          </h1>
          <p className="text-gray-400">Enter a product URL to crawl data and generate video prompts.</p>
        </header>

        {/* Flex Container for Side-by-Side Layout */}
        <div className="flex flex-row gap-6">

          {/* Left Column: Crawl Form */}
          <div className="basis-1/3">
            <CrawlForm<CrawledData>
              onDataCrawled={setData}
              onImageSelect={(url) => setReferenceImage(url)}
            />
          </div>

          {/* Right Column: Video Prompt Generator */}
          <div className="basis-2/3">
            <VideoPromptGenerator crawledData={data} referenceImage={referenceImage ?? undefined} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
