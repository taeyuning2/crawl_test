import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ],
});

interface ProductDetail {
  text?: string; 
  image?: string;
  imageText?: string; // 이미지에서 추출한 텍스트
  detailTitle?: string;
  detailSub?: string;
}

interface ProductData {
  name: string | null;
  brand: string | null;
  price: string | null;
  originalPrice: string | null;
  salePrice: string | null;
  imageUrl: string | null;
  details: ProductDetail[];
}

async function urlToGenerativePart(url: string, mimeType: string) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return {
    inlineData: {
      data: Buffer.from(response.data).toString('base64'),
      mimeType,
    },
  };
}
//tnwjdsdfsdf
async function analyzeImageText(imageUrl: string, prompt: string): Promise<string | null> {
  try {
    const imagePart = await urlToGenerativePart(imageUrl, 'image/jpeg');
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error(`Image analysis failed (${imageUrl}):`, error);
    return null;
  }
}

// Normalize image URLs (handles //, relative)
function toAbsoluteUrl(src: string | undefined, base: string): string | null {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  try {
    return new URL(src, base).toString();
  } catch {
    return null;
  }
}

export const fetchProductData = async (url: string): Promise<ProductData> => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      },
    });

    const $ = cheerio.load(data);

    // 메타 태그에서 기본 정보 우선 추출
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogPrice = $('meta[property="og:price:amount"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');
    const ogDescription = $('meta[property="og:description"]').attr('content');

    // 메인 상품 이미지 (상대경로 포함 정규화)
    let mainImageSrc = toAbsoluteUrl($('.product__media img').attr('src'), url);

    // 가격 텍스트 원본 추출
    const salePriceText = $('.price-item--sale').first().text().trim();
    const regularPriceText = $('.price-item--regular').first().text().trim();

    // 브랜드명 추출 (제공된 구조 기준)
    const brand =
      $('.product__text.inline-richtext.sub-heading a').first().text().trim() ||
      $('.product__text.inline-richtext.sub-heading').first().text().trim() ||
      null;

    const salePrice = salePriceText ? salePriceText.replace(/\s+/g, ' ') : null;
    const originalPrice = regularPriceText ? regularPriceText.replace(/\s+/g, ' ') : null;
    const price = salePrice || originalPrice || (ogPrice ? `$${ogPrice}` : null);

    // 상품명/대표 이미지 결정
    const name = ogTitle || $('h1.product__title').text().trim() || null;
    const imageUrl = mainImageSrc || ogImage || $('div.product-media-gallery img').attr('src') || null;

    // 상세 설명 수집 시작
    let details: ProductDetail[] = [];
    if (ogDescription) {
      details.push({ text: ogDescription });
    }

    $('.details-imgtxt').each((_i, el) => {
      const text = $(el).find('.details-txt').text().trim().replace(/\s+/g, ' ');
      const detailTitle = $(el).find('.details-txt h2').text().trim().replace(/\s+/g, ' ');
      const detailSub = $(el)
        .find('.details-txt p')
        .map((_, p) => $(p).text().trim().replace(/\s+/g, ' '))
        .get()
        .filter(Boolean)
        .join(' ');
      let imgSrc = toAbsoluteUrl($(el).find('.details-img img').attr('src'), url);
      if (text || imgSrc) {
        details.push({
          text,
          detailTitle: detailTitle || undefined,
          detailSub: detailSub || undefined,
          image: imgSrc || undefined,
          imageText: '',
        });
      }
    });

    // 2-1. 전체 폭 이미지(.details-whole-img)도 상세로 포함
    $('.details-whole-img img').each((_i, el) => {
      const imgSrc = toAbsoluteUrl($(el).attr('src'), url);
      const altText = $(el).attr('alt')?.trim();
      if (imgSrc) {
        details.push({
          text: altText || undefined,
          image: imgSrc || undefined,
          imageText: '',
        });
      }
    });

    if (details.length <= (ogDescription ? 1 : 0)) {
      $('.details-txt').each((_i, el) => {
        const detailText = $(el).text().trim().replace(/\s+/g, ' ');
        if (detailText && detailText !== ogDescription) {
          details.push({ text: detailText });
        }
      });
    }

    // 3. 상세 이미지 내 텍스트 추출 (Gemini 활용)
    console.log(`상세 이미지 분석 시작 (총 ${details.filter(d => d.image).length})`);
    for (const [index, detail] of details.entries()) {
      if (detail.image) {
        const fullImageUrl = detail.image.startsWith('http') ? detail.image : new URL(detail.image, url).toString();
        console.log(`[${index + 1}] 이미지 분석 중: ${fullImageUrl}`);

        const extractedText = await analyzeImageText(
          fullImageUrl,
          'Extract every visible text string from this image exactly as written. Do not translate or paraphrase. Include any ad copy or taglines. If there is no text, return the string "NO_TEXT".',
        );

        console.log(`[${index + 1}] 분석 결과:`, extractedText ? `${extractedText.substring(0, 50)}...` : 'fail');

        if (extractedText && extractedText !== 'NO_TEXT') {
          detail.imageText = extractedText;
        }
      }
    }

    // 4. 메인 이미지 분석 (전체 요약)
    if (imageUrl) {
      const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : new URL(imageUrl, url).toString();
      const prompt = `
Extract every visible English text from this image exactly as written. Do not translate or summarize. Include any taglines or ad copy exactly as shown.
Return only a JSON array of strings, e.g. ["Line 1", "Line 2"]. If there is no text, return [].
`;

      const analysisResult = await analyzeImageText(fullImageUrl, prompt);

      if (analysisResult) {
        try {
          const cleanJson = analysisResult.replace(/```json/g, '').replace(/```/g, '').trim();
          const geminiDetails = JSON.parse(cleanJson);
          if (Array.isArray(geminiDetails)) {
            const geminiStructuredDetails = geminiDetails.map((d: string) => ({ text: d }));
            details = [...details, ...geminiStructuredDetails];
          }
        } catch (e) {
          console.error('Gemini 메인 이미지 파싱 실패:', e);
        }
      }
    }

    return { name, brand, price, originalPrice, salePrice, imageUrl, details };
  } catch (error) {
    console.error(`데이터를 가져오는 중 오류 발생 '${url}':`, error);
    throw new Error('HTML을 가져오거나 파싱하는 데 실패했습니다.');
  }
};
