import {Controller, HttpCode, Param, Post, Req, UseGuards, Get} from "@nestjs/common";
import { BookmarksService } from "./bookmarks.service";
import { AuthGuard } from "../auth/auth.guard";

@Controller()
export class BookmarksController {
    constructor(private readonly bookmarksService: BookmarksService) {}

    // 저장 토글
    @Post('posts/:id/bookmark')
    @HttpCode(200)
    @UseGuards(AuthGuard)
    async toggleBookmark(@Param('id') id: string, @Req() req: any) {
        return this.bookmarksService.toggleBookmark(id, req.user.id);
    }

    // 내가 이 글을 저장했는지 확인
    @Get('posts/:id/bookmark')
    @UseGuards(AuthGuard)
    async inBookmarked(@Param('id') id: string, @Req() req: any) {
        return this.bookmarksService.isBookMarked(id, req.user.id);
    }

    // 내가 저장한 글 목록
    @Get('bookmarks')
    @UseGuards(AuthGuard)
    async getMyBookmarks(@Req() req: any) {
        return this.bookmarksService.getMyBookmarks(req.user.id);
    }
}