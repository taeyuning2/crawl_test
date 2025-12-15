import cors from 'cors';
import express, { Request, Response } from 'express';
import crawlRoutes from './routes/crawl';

const app = express();
const port = 3000;

// CORS 미들웨어 추가
app.use(cors());

// JSON 요청 본문을 파싱하기 위한 미들웨어
app.use(express.json());

// 기본 라우트
app.get('/', (req: Request, res: Response) => {
  res.send('크롤링 서버가 실행 중입니다!');
});

// 크롤링 라우트 추가
app.use('/api', crawlRoutes);

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
