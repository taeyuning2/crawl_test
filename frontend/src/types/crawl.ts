export type CrawledData = {
  url?: string;
  title?: string;
  brand?: string;
  description?: string;
} & Record<string, unknown>;
