import { HttpException } from '@nestjs/common';

// 기존 AppError(statusCode, message)와 같은 사용법 유지
export class AppError extends HttpException {
    constructor(statusCode: number, message: string) {
        super({ message }, statusCode);
    }
}
