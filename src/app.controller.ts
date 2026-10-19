import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    root() {
        return { message: '서버 정상 작동 중' };
    }
}
