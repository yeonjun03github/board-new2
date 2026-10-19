import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import db, { nextId } from '../config/db';
import { AppError } from '../utils/AppError';

@Injectable()
export class AuthService {
    async register({ username, password }: { username: string; password: string }) {
        if (!username || !password) {
            throw new AppError(400, '아이디와 비밀번호를 입력해주세요.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            await db.collection('users').insertOne({
                id: await nextId('users'),
                username,
                password: hashedPassword,
                created_at: new Date(),
            });
        } catch (error: any) {
            // MySQL의 ER_DUP_ENTRY → MongoDB의 중복 키 에러 코드 11000
            if (error.code === 11000) {
                throw new AppError(409, '이미 존재하는 아이디입니다.');
            }
            throw error;
        }
    }

    async login({ username, password }: { username: string; password: string }) {
        if (!username || !password) {
            throw new AppError(400, '아이디와 비밀번호를 입력해주세요.');
        }

        const user = await db.collection('users').findOne({ username });

        if (!user) {
            throw new AppError(401, '아이디 또는 비밀번호가 틀렸습니다.');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new AppError(401, '아이디 또는 비밀번호가 틀렸습니다.');
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        return token;
    }
}
