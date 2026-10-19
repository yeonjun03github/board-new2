import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';

// 기존 authMiddleware(req, res, next) → CanActivate (true면 next(), throw면 401 응답)
@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            throw new AppError(401, '토큰이 없습니다!');
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            req.user = decoded;
            return true;
        } catch (error) {
            throw new AppError(401, '로그인이 만료되었습니다. 다시 로그인해주세요.');
        }
    }
}
