import {
    Body, Controller, Delete, Get, Param, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { AuthGuard } from '../auth/auth.guard';
import { uploadOptions } from '../config/upload';
import {PreviewDto} from "./preview.dto";
import { ValidationPipe } from '@nestjs/common';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    // 글 목록 조회
    @Get()
    async getPosts() {
        return this.postsService.getPosts();
    }

    // 글 상세 조회
    @Get(':id')
    async getPost(@Param('id') id: string) {
        return this.postsService.getPostById(id);
    }

    // 핑퐁 테스트
    @Get('practice/ping')
    ping() {
        return {
            "message": "안녕하세요",
            "status": "success"
        };
    }

    @Get('practice/hello/:name')
    hello(@Param('name') name: string) {
        return { message: '안녕하세요, ' + name };
    }

    @Get('practice/age/:age')
    age(@Param('age') age: string) {
        return { age: age };
    }

    // // 컨트롤러에서 연산처리
    // @Get('practice/double/:num')
    // number(@Param('num') num: string) {
    //     return { result: Number(num) * 2 };
    // }

    // 서비스에서 함수로 2배 연산처리
    @Get('practice/double/:num')
    number2(@Param('num') num: string) {
        const result = this.postsService.double(Number(num));
        return { result2: result };
    }

    // 서비스에서 함수로 3배 연산처리
    @Get('practice/triple/:num')
    number3(@Param('num') num: string) {
        const result = this.postsService.triple(Number(num));
        return { result3: result };
    }

    // 바디 테스트
    @Post('practice/greet')
    greet(@Body() body: any) {
        return { message: '안녕하세요, ' + body.name };
    }

    // 글 작성  (router.post('/', authMiddleware, upload.single('image'), createPost))
    @Post()
    @UseGuards(AuthGuard)
    @UseInterceptors(FileInterceptor('image', uploadOptions))
    async createPost(@Body() body: any, @Req() req: any, @UploadedFile() file?: Express.Multer.File) {
        const { title, content } = body;
        const user_id = req.user.id;
        const image = file ? '/uploads/' + file.filename : null;

        await this.postsService.createPost({ title, content, image, user_id });
        return { message: '글 작성 완료' };
    }

    // 글 수정
    @Put(':id')
    @UseGuards(AuthGuard)
    @UseInterceptors(FileInterceptor('image', uploadOptions))
    async updatePost(
        @Param('id') id: string,
        @Body() body: any,
        @Req() req: any,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const { title, content } = body;
        const user_id = req.user.id;
        const image = file ? '/uploads/' + file.filename : null;

        await this.postsService.updatePost(id, { title, content, image, user_id });
        return { message: '글 수정 완료' };
    }

    // 글 삭제
    @Delete(':id')
    @UseGuards(AuthGuard)
    async deletePost(@Param('id') id: string, @Req() req: any) {
        const user_id = req.user.id;

        await this.postsService.deletePost(id, user_id);
        return { message: '글 삭제 완료' };
    }

    // 조회수 연습 API
    @Get(':id/views')
    async getPostViews(@Param('id') id: string) {
        const count = await this.postsService.getViews(id);
        return { views: count };
    }

    // 제목 불러오기 연습 API
    @Get(':id/title')
    async getTitle(@Param('id') id: string) {
        const title = await this.postsService.getTitle(id);
        return { title: title };
    }

    // 본문 글자수 연습 API
    @Post('practice/preview')
    async preview(
        @Body(new ValidationPipe()) body: PreviewDto
    ) {
        return {
            title: body.title,
            length: body.content.length
        };
    }
}
