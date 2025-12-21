export type CrawledData = {
  url?: string;
  title?: string;
  brand?: string;
  description?: string;
  name?: string;
  price?: string | null;
  originalPrice?: string | null;
  salePrice?: string | null;
  imageUrl?: string | null;
  mainImages?: string[];
  details?: Array<{
    text?: string | null;
    image?: string | null;
    imageText?: string | null;
    detailTitle?: string | null;
    detailSub?: string | null;
  }>;
  referenceImage?: string;
} & Record<string, unknown>;
