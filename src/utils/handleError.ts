import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';

// 기존 handleError(res, error)를 전역 예외 필터로 대체
// - statusCode가 있는 에러 → 그 상태코드 + { message }
// - 그 외 → 500 { message: '서버 오류 500' }
@Catch()
export class HandleErrorFilter implements ExceptionFilter {
    catch(error: unknown, host: ArgumentsHost) {
        const res = host.switchToHttp().getResponse();

        if (error instanceof HttpException) {
            return res.status(error.getStatus()).json({ message: error.message });
        }
        res.status(500).json({ message: '서버 오류 500' });
    }
}
