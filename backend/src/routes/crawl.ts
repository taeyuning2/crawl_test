import { Router } from 'express';
import { crawlProduct } from '../controllers/crawlController';

const router = Router();

// POST /api/crawl 엔드포인트 정의
router.post('/crawl', crawlProduct);

export default router;
