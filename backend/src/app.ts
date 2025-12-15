import cors from 'cors';
import express, { Request, Response } from 'express';
import crawlRoutes from './routes/crawl';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const allowedOrigins =
  (
    process.env.ALLOWED_ORIGINS ||
    'http://localhost:5173,http://localhost:3000,https://crawl-test.vercel.app'
  )
    .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// allow preview URLs like https://<branch>-<team>.vercel.app
const allowedOriginSuffixes =
  (process.env.ALLOWED_ORIGIN_SUFFIXES || '.vercel.app')
    .split(',')
    .map(suffix => suffix.trim())
    .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow tools like curl/postman with no origin
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        allowedOriginSuffixes.some(suffix => origin.endsWith(suffix));
      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

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
