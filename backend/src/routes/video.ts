import { Router } from 'express';
import axios from 'axios';

const router = Router();

type VeoRequestBody = {
  prompt: string;
  durationSec?: number;
  aspectRatio?: string;
};

// 간단한 Veo 3 프록시 엔드포인트
router.post('/', async (req, res) => {
  const { prompt, durationSec = 10, aspectRatio = '16:9' } = req.body as VeoRequestBody;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const apiKey = process.env.VEO_API_KEY || process.env.GEMINI_API_KEY;
  const endpoint =
    process.env.VEO_API_URL ||
    'https://generativelanguage.googleapis.com/v1beta/models/veo-001:generateVideo';
  if (!apiKey) {
    return res.status(500).json({ error: 'VEO_API_KEY (or GEMINI_API_KEY) is not set on the server' });
  }

  try {
    const response = await axios.post(
      `${endpoint}?key=${apiKey}`,
      {
        prompt: { text: prompt },
        config: {
          durationSeconds: durationSec,
          aspectRatio,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    // Veo 응답은 비동기 작업 ID를 줄 수 있으므로 그대로 전달
    return res.json(response.data);
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const message = error?.response?.data || error?.message || 'veo request failed';
    console.error('Veo API error:', {
      status,
      message,
      data: error?.response?.data,
      endpoint,
    });
    return res.status(status).json({ error: message, endpoint });
  }
});

export default router;
