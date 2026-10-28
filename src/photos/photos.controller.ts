import {
    Body, Controller, Delete, Get, Param, Post, Put, Req, UploadedFiles, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PhotosService } from './photos.service';
import { AuthGuard } from '../auth/auth.guard';
import { uploadOptions } from '../config/upload';

// 업로드된 파일 정보 → DB에 저장할 경로 배열 ('/uploads/파일명')
const toPaths = (files?: Express.Multer.File[]) => (files || []).map((f) => '/uploads/' + f.filename);

@Controller('photos')
export class PhotosController {
    constructor(private readonly photosService: PhotosService) {}

    // 사진 목록 조회
    @Get()
    async getPhotos() {
        return this.photosService.getPhotos();
    }

    // 사진 상세 조회
    @Get(':id')
    async getPhoto(@Param('id') id: string) {
        return this.photosService.getPhotoById(id);
    }

    // 사진 작성 (사진 여러 장: 필드 이름 'images', 최대 10장)
    @Post()
    @UseGuards(AuthGuard)
    @UseInterceptors(FilesInterceptor('images', 10, uploadOptions))
    async createPhoto(@Body() body: any, @Req() req: any, @UploadedFiles() files: Express.Multer.File[]) {
        const { title, description } = body;
        const user_id = req.user.id;

        await this.photosService.createPhoto({ title, description, images: toPaths(files), user_id });
        return { message: '사진 등록 완료' };
    }

    // 사진 수정
    @Put(':id')
    @UseGuards(AuthGuard)
    @UseInterceptors(FilesInterceptor('images', 10, uploadOptions))
    async updatePhoto(
        @Param('id') id: string,
        @Body() body: any,
        @Req() req: any,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        const { title, description } = body;
        const user_id = req.user.id;

        await this.photosService.updatePhoto(id, { title, description, images: toPaths(files), user_id });
        return { message: '사진 수정 완료' };
    }

    // 사진 삭제
    @Delete(':id')
    @UseGuards(AuthGuard)
    async deletePhoto(@Param('id') id: string, @Req() req: any) {
        const user_id = req.user.id;

        await this.photosService.deletePhoto(id, user_id);
        return { message: '사진 삭제 완료' };
    }
}
