import { Injectable } from '@nestjs/common';
import db from '../config/db';

@Injectable()
export class LikesService {
    // 특정 글의 좋아요 목록 조회
    async getLikes(postId: string) {
        return db.collection('likes')
            .find({ post_id: Number(postId) }, { projection: { _id: 0, user_id: 1 } })
            .toArray();
    }

    // 좋아요 토글 (눌러져 있으면 취소, 안 눌러져 있으면 추가)
    async toggleLike(postId: string, userId: number) {
        const filter = { post_id: Number(postId), user_id: userId };
        const existing = await db.collection('likes').findOne(filter);

        if (existing) {
            await db.collection('likes').deleteOne(filter);
            return { liked: false };
        }

        await db.collection('likes').insertOne({ ...filter, created_at: new Date() });
        return { liked: true };
    }
}
