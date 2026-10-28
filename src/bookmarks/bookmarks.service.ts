import { Injectable } from '@nestjs/common';
import db from '../config/db';
import { AppError } from '../utils/AppError';

@Injectable()
export class BookmarksService {
    // 저장 토글 (저장 안 됐으면 저장, 됐으면 취소!)
    async toggleBookmark(post_id: string, user_id: number) {
        // 진짜 있는 글인지 먼저 확인.
        const post = await db.collection('posts').findOne({ id: Number(post_id) });
        if (!post) {
            throw new AppError(404, `No post with id ${post_id}`);
        }

        // 이미 저장한건지 확인해서 취소 혹은 저장.
        const filter = { post_id: Number(post_id), user_id };
        const existing = await db.collection('bookmarks').findOne(filter);

        if (existing) {
            await db.collection('bookmarks').deleteOne(filter);
            return { bookmarked: false};
        }

        await db.collection('bookmarks').insertOne({ ...filter, created_at: new Date() });
        return { bookmarked: true };
    }

    async isBookMarked(post_id: string, user_id: number) {
        const existing = await db.collection('bookmarks').findOne({
            post_id: Number(post_id),
            user_id,
        });
        return { bookmarked: !!existing};
    }

    async getMyBookmarks(user_id: number) {
        return db.collection('bookmarks').aggregate([
            { $match: { user_id } },
            // 내 책갈피만
            { $lookup: { from: 'posts', localField: 'post_id', foreignField: 'id', as: 'p' } },
            { $unwind: '$p' },
            { $lookup: { from: 'users', localField: 'p.user_id', foreignField: 'id', as: 'u' } },
            { $unwind: '$u' },
            { $sort: { created_at: -1 } },
            // 최근 저장한 순
            {
                $project: {
                    // 보여줄 것만 고르기
                    _id: 0,
                    id: '$p.id',
                    title: '$p.title',
                    username: '$u.username',
                    created_at: '$p.created_at',
                    views: '$p.views',
                    bookmarked_at: '$created_at',
                },
            },
        ]).toArray();
    }
}