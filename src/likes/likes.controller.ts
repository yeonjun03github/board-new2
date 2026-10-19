import { Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { LikesService } from './likes.service';
import { AuthGuard } from '../auth/auth.guard';

// 기존에도 postRoutes.js 안에 /posts/:id/likes 로 있었음 → prefix는 'posts'
@Controller('posts')
export class LikesController {
    constructor(private readonly likesService: LikesService) {}

    // 좋아요 목록 조회
    @Get(':id/likes')
    async getLikes(@Param('id') id: string) {
        return this.likesService.getLikes(id);
    }

    // 좋아요 토글
    @Post(':id/likes')
    @HttpCode(200)
    @UseGuards(AuthGuard)
    async toggleLike(@Param('id') id: string, @Req() req: any) {
        const user_id = req.user.id;
        return this.likesService.toggleLike(id, user_id);
    }
}
