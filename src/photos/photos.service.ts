import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import db, { nextId } from '../config/db';
import { AppError } from '../utils/AppError';

// DB에 저장된 사진 경로('/uploads/a.jpg')로 실제 파일을 디스크에서 지운다
async function removeFiles(images: string[] = []) {
    for (const image of images) {
        if (!image.startsWith('/uploads/') || image.includes('..')) continue; // 안전장치
        await fs.rm(path.join(process.cwd(), 'public', image), { force: true });
    }
}

@Injectable()
export class PhotosService {
    // 사진 목록 조회 (썸네일 = 첫 번째 사진)
    async getPhotos() {
        return db.collection('photos').aggregate([
            { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'u' } },
            { $unwind: '$u' },
            { $sort: { created_at: -1, id: -1 } },
            {
                $project: {
                    _id: 0,
                    id: 1,
                    title: 1,
                    thumbnail: { $arrayElemAt: ['$images', 0] },
                    image_count: { $size: { $ifNull: ['$images', []] } },
                    created_at: 1,
                    views: 1,
                    username: '$u.username',
                },
            },
        ]).toArray();
    }

    // 사진 상세 조회
    async getPhotoById(id: string) {
        const rows = await db.collection('photos').aggregate([
            { $match: { id: Number(id) } },
            { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'u' } },
            { $unwind: '$u' },
            { $addFields: { username: '$u.username' } },
            { $project: { _id: 0, u: 0 } },
        ]).toArray();
        if (rows.length === 0) {
            throw new AppError(404, '사진을 찾을 수 없습니다. 404');
        }

        await db.collection('photos').updateOne({ id: Number(id) }, { $inc: { views: 1 } });
        rows[0].views += 1;

        return rows[0];
    }

    // 사진 작성
    async createPhoto({ title, description, images, user_id }: any) {
        if (!title) {
            await removeFiles(images); // 이미 저장된 파일이 남지 않도록 정리
            throw new AppError(400, '제목을 입력해주세요.');
        }
        if (images.length === 0) {
            throw new AppError(400, '사진을 1장 이상 올려주세요.');
        }

        const now = new Date();
        await db.collection('photos').insertOne({
            id: await nextId('photos'),
            user_id,
            title,
            description: description || '',
            images,
            views: 0,
            created_at: now,
            updated_at: now,
        });
    }

    // 사진 수정 (새 사진을 올리면 기존 사진을 모두 교체, 안 올리면 기존 사진 유지)
    async updatePhoto(id: string, { title, description, images, user_id }: any) {
        const photo = await db.collection('photos').findOne({ id: Number(id) });
        if (!photo) {
            await removeFiles(images);
            throw new AppError(404, '사진을 찾을 수 없습니다. 404');
        }
        if (photo.user_id !== user_id) {
            await removeFiles(images);
            throw new AppError(403, '본인 글만 수정할 수 있습니다. 403');
        }
        if (!title) {
            await removeFiles(images);
            throw new AppError(400, '제목을 입력해주세요.');
        }

        const set: any = { title, description: description || '', updated_at: new Date() };
        if (images.length > 0) set.images = images;

        await db.collection('photos').updateOne({ id: Number(id) }, { $set: set });

        if (images.length > 0) await removeFiles(photo.images); // 교체된 옛 파일 삭제
    }

    // 사진 삭제
    async deletePhoto(id: string, user_id: number) {
        const photo = await db.collection('photos').findOne({ id: Number(id) });
        if (!photo) {
            throw new AppError(404, '사진을 찾을 수 없습니다. 404');
        }
        if (photo.user_id !== user_id) {
            throw new AppError(403, '본인 글만 삭제할 수 있습니다. 403');
        }

        await db.collection('photos').deleteOne({ id: Number(id) });
        await removeFiles(photo.images);
    }
}
