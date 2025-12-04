import { Request, Response } from 'express';
import { fetchProductData } from '../services/crawlingService';

export const crawlProduct = async (req: Request, res: Response) => {
  let { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: '크롤링할 URL을 제공해야 합니다.' });
  }

  // URL이 http로 시작하지 않으면 제품 슬러그로 간주하고 기본 URL을 붙입니다.
  if (!url.startsWith('http')) {
    // 슬래시가 중복되지 않도록 처리
    const baseUrl = 'https://global.amoremall.com/products/';
    url = url.startsWith('/') ? `${baseUrl}${url.substring(1)}` : `${baseUrl}${url}`;
  }

  try {
    const data = await fetchProductData(url);

    // details 배열의 길이와 내용을 확인하기 위한 로그 추가
    console.log('"details" 배열의 길이:', data.details.length);
    console.log('수집된 "details" 내용:', JSON.stringify(data.details, null, 2));

    res.json(data);
  } catch (error) {
    console.error('크롤링 중 오류 발생:', error);
    res.status(500).json({ error: '데이터를 가져오는 데 실패했습니다.' });
  }
};
