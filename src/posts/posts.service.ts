import { Injectable } from '@nestjs/common';
import db, { nextId } from '../config/db';
import { AppError } from '../utils/AppError';

@Injectable()
export class PostsService {
    // 글 목록 조회
    // (posts JOIN users → $lookup + $unwind, ORDER BY created_at DESC → $sort)
    async getPosts() {
        return db.collection('posts').aggregate([
            { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'u' } },
            { $unwind: '$u' },
            { $sort: { created_at: -1, id: -1 } },
            { $project: { _id: 0, id: 1, title: 1, created_at: 1, views: 1, username: '$u.username' } },
        ]).toArray();
    }

    // 글 상세 조회
    async getPostById(id: string) {
        const rows = await db.collection('posts').aggregate([
            { $match: { id: Number(id) } },
            { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'u' } },
            { $unwind: '$u' },
            { $addFields: { username: '$u.username' } },
            { $project: { _id: 0, u: 0 } },
        ]).toArray();
        if (rows.length === 0) {
            throw new AppError(404, '글을 찾을 수 없습니다. 404');
        }

        await db.collection('posts').updateOne({ id: Number(id) }, { $inc: { views: 1 } });
        rows[0].views += 1;

        return rows[0];
    }

    // 글 작성
    async createPost({ title, content, image, user_id }: any) {
        if (!title || !content) {
            throw new AppError(400, '제목과 내용을 입력해주세요.');
        }

        const now = new Date();
        await db.collection('posts').insertOne({
            id: await nextId('posts'),
            user_id,
            title,
            content,
            created_at: now,
            updated_at: now,
            image,
            views: 0,
        });
    }

    // 글 수정
    async updatePost(id: string, { title, content, image, user_id }: any) {
        const post = await db.collection('posts').findOne({ id: Number(id) });
        if (!post) {
            throw new AppError(404, '글을 찾을 수 없습니다. 404');
        }
        if (post.user_id !== user_id) {
            throw new AppError(403, '본인 글만 수정할 수 있습니다. 403');
        }

        // 새 이미지를 안 올렸으면(null) 기존 이미지를 그대로 유지
        const newImage = image || post.image;

        await db.collection('posts').updateOne(
            { id: Number(id) },
            { $set: { title, content, image: newImage, updated_at: new Date() } }
        );
    }

    // 글 삭제
    async deletePost(id: string, user_id: number) {
        const post = await db.collection('posts').findOne({ id: Number(id) });
        if (!post) {
            throw new AppError(404, '글을 찾을 수 없습니다. 404');
        }
        if (post.user_id !== user_id) {
            throw new AppError(403, '본인 글만 삭제할 수 있습니다. 403');
        }

        // Mongo에는 외래키 CASCADE가 없으므로 딸린 데이터(댓글, 댓글 좋아요, 글 좋아요)를 직접 지운다
        const comments = await db.collection('comments').find({ post_id: Number(id) }).toArray();
        const commentIds = comments.map((c) => c.id);
        await db.collection('comment_likes').deleteMany({ comment_id: { $in: commentIds } });
        await db.collection('comments').deleteMany({ post_id: Number(id) });
        await db.collection('likes').deleteMany({ post_id: Number(id) });
        await db.collection('posts').deleteOne({ id: Number(id) });
    }

    double(num: number) {
        return num * 2;
    }

    triple(num: number) {
        return num * 3;
    }

    // 조회수 연습 API
    async getViews(post_id: string) {
        const post = await db.collection('posts').findOne(
            { id: Number(post_id) },
            { projection: { _id: 0, views: 1 } }
        );

        if (!post) {
            throw new AppError(404, '게시글을 찾을 수 없습니다.');
        }

        return post.views;
    }

    // 제목 불러오기 연습 API
    async getTitle(post_id: string) {
        const post = await db.collection('posts').findOne(
            { id: Number(post_id) },
            { projection: { _id: 0, title: 1 } }
        );

        if (!post) {
            throw new AppError(404, '게시글을 찾을 수 없습니다.');
        }

        return post.title;
    }
}
