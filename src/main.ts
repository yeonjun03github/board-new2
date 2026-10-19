import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HandleErrorFilter } from './utils/handleError';
import { ensureIndexes } from './config/db';

async function bootstrap() {
    await ensureIndexes(); // MongoDB 연결 + 인덱스(UNIQUE) 준비
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const PORT = process.env.PORT || 3000;

    // express.json()은 Nest가 기본 제공
    app.useGlobalFilters(new HandleErrorFilter());
    app.useStaticAssets('public'); // app.use(express.static('public'))

    await app.listen(PORT);
    console.log(`서버 실행 중: http://localhost:${PORT}`);
}
bootstrap();
