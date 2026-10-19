import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(@Body() body: any) {
        const { username, password } = body;
        await this.authService.register({ username, password });
        return { message: '회원가입 성공' }; // Nest의 POST 기본 상태코드 201
    }

    @Post('login')
    @HttpCode(200) // Nest의 POST 기본값은 201이라 기존(200)에 맞춤
    async login(@Body() body: any) {
        const { username, password } = body;
        const token = await this.authService.login({ username, password });
        return { token };
    }
}
