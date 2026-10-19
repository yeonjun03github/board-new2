import { Injectable } from '@nestjs/common';
import db, { nextId } from '../config/db';
import { AppError } from '../utils/AppError';

@Injectable()
export class CommentsService {
    // (comments JOIN users → $lookup + $unwind, IF(is_deleted...) → $cond)
    async getComments(post_id: string) {
        return db.collection('comments').aggregate([
            { $match: { post_id: Number(post_id) } },
            { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'u' } },
            { $unwind: '$u' },
            { $sort: { created_at: 1, id: 1 } },
            {
                $project: {
                    _id: 0,
                    id: 1,
                    content: { $cond: [{ $eq: ['$is_deleted', 1] }, '삭제된 댓글입니다.', '$content'] },
                    created_at: 1,
                    user_id: 1,
                    parent_id: 1,
                    is_deleted: 1,
                    username: '$u.username',
                },
            },
        ]).toArray();
    }

    async createComment(post_id: string, { content, user_id, parent_id }: any) {
        if (!content) {
            throw new AppError(400, '내용을 입력해주세요.');
        }

        // MySQL에서는 외래키가 막아주던 부분: 글이 실제로 있어야 댓글을 달 수 있음
        const post = await db.collection('posts').findOne({ id: Number(post_id) });
        if (!post) {
            throw new AppError(404, '글을 찾을 수 없습니다. 404');
        }

        // 대댓글이면 부모 댓글이 이 글에 실제로 있는지 먼저 확인
        if (parent_id) {
            const parent = await db.collection('comments').findOne({
                id: Number(parent_id),
                post_id: Number(post_id),
            });
            // 삭제 표시된 댓글에는 대댓글을 달 수 없음
            if (!parent || parent.is_deleted === 1) {
                throw new AppError(404, '대상을 찾을 수 없습니다. 404');
            }
        }

        await db.collection('comments').insertOne({
            id: await nextId('comments'),
            post_id: Number(post_id),
            user_id,
            content,
            created_at: new Date(),
            parent_id: parent_id ? Number(parent_id) : null, // 없으면 일반 댓글
            is_deleted: 0,
        });
    }

    async deleteComment(id: string, user_id: number) {
        const comment = await db.collection('comments').findOne({ id: Number(id) });
        if (!comment || comment.is_deleted) {
            throw new AppError(404, '댓글을 찾을 수 없습니다. 404');
        }
        if (comment.user_id !== user_id) {
            throw new AppError(403, '본인 댓글만 삭제할 수 있습니다. 403');
        }

        // 대댓글이 달려 있으면 행은 남기고 삭제 표시만, 없으면 기존처럼 완전 삭제
        const reply = await db.collection('comments').findOne({ parent_id: Number(id) });
        if (reply) {
            await db.collection('comments').updateOne({ id: Number(id) }, { $set: { is_deleted: 1 } });
        } else {
            await db.collection('comments').deleteOne({ id: Number(id) });
            await db.collection('comment_likes').deleteMany({ comment_id: Number(id) });
        }
    }

    async updateComment(id: string, { content, user_id }: any) {
        if (!content) {
            throw new AppError(400, '내용을 입력해주세요.');
        }

        const comment = await db.collection('comments').findOne({ id: Number(id) });
        if (!comment || comment.is_deleted) {
            throw new AppError(404, '댓글을 찾을 수 없습니다. 404');
        }
        if (comment.user_id !== user_id) {
            throw new AppError(403, '본인 댓글만 수정할 수 있습니다. 403');
        }

        await db.collection('comments').updateOne({ id: Number(id) }, { $set: { content } });
    }

    // comments.service.ts (추가)
    async getLikes(comment_id: string) {
        return db.collection('comment_likes')
            .find({ comment_id: Number(comment_id) }, { projection: { _id: 0, user_id: 1 } })
            .toArray();
    }

    async toggleLike(comment_id: string, user_id: number) {
        // ① 눌러도 되는 댓글인지 확인 (없거나 삭제된 댓글이면 404)
        const comment = await db.collection('comments').findOne({ id: Number(comment_id) });
        if (!comment || comment.is_deleted === 1) {
            throw new AppError(404, '댓글을 찾을 수 없습니다. 404');
        }

        // ② 이미 눌렀는지 확인해서 취소/추가
        const filter = { comment_id: Number(comment_id), user_id };
        const existing = await db.collection('comment_likes').findOne(filter);
        if (existing) {
            await db.collection('comment_likes').deleteOne(filter);
            return { liked: false };
        }
        await db.collection('comment_likes').insertOne(filter);
        return { liked: true };
    }

    async countComments(post_id: string) {
        return db.collection('comments').countDocuments({ post_id: Number(post_id) });
    }
}
