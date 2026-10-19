import { MongoClient } from 'mongodb';
import 'dotenv/config';

// 기존 mysql.createPool(...) 자리. 연결은 첫 호출 때 자동으로 맺어진다.
const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017');

// pool 대신 db를 쓴다:  db.collection('posts').find(...)  ← pool.query('SELECT ... FROM posts')
const db = client.db(process.env.MONGO_DB_NAME || 'board_nest');

// MySQL의 AUTO_INCREMENT 대신: counters 컬렉션의 번호를 1씩 올려서 새 id로 쓴다.
export async function nextId(name: string): Promise<number> {
    const doc = await db.collection<{ _id: string; seq: number }>('counters').findOneAndUpdate(
        { _id: name },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
    return doc!.seq;
}

// MySQL의 UNIQUE / PRIMARY KEY 역할 (서버 시작 때 1회, 이미 있으면 그대로 둔다)
export async function ensureIndexes() {
    await db.collection('users').createIndex({ id: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('posts').createIndex({ id: 1 }, { unique: true });
    await db.collection('comments').createIndex({ id: 1 }, { unique: true });
    await db.collection('likes').createIndex({ post_id: 1, user_id: 1 }, { unique: true });
    await db.collection('comment_likes').createIndex({ comment_id: 1, user_id: 1 }, { unique: true });
}

export default db;
