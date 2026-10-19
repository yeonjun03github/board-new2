import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Get(':post_id')
    async getComments(@Param('post_id') post_id: string) {
        return this.commentsService.getComments(post_id);
    }

    @Post(':post_id')
    @UseGuards(AuthGuard)
    async createComment(@Param('post_id') post_id: string, @Body() body: any, @Req() req: any) {
        const { content, parent_id } = body;
        const user_id = req.user.id;

        await this.commentsService.createComment(post_id, { content, user_id, parent_id });
        return { message: '댓글이 성공적으로 작성되었습니다!' };
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    async deleteComment(@Param('id') id: string, @Req() req: any) {
        const user_id = req.user.id;

        await this.commentsService.deleteComment(id, user_id);
        return { message: '댓글 삭제 완료' };
    }

    // 댓글 수정
    @Put(':id')
    @UseGuards(AuthGuard)
    async updateComment(@Param('id') id: string, @Body() body: any, @Req() req: any) {
        const { content } = body;
        const user_id = req.user.id;

        await this.commentsService.updateComment(id, { content, user_id });
        return { message: '댓글 수정 완료' };
    }

    // comments.controller.ts (추가)
    @Get(':id/likes')
    async getLikes(@Param('id') id: string) { return this.commentsService.getLikes(id); }

    @Post(':id/likes')
    @HttpCode(200)            // 기존 글 좋아요처럼 200으로 응답
    @UseGuards(AuthGuard)     // 로그인한 사람만
    async toggleLike(@Param('id') id: string, @Req() req: any) {
        return this.commentsService.toggleLike(id, req.user.id);
    }
}
