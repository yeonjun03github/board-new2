// 1회용 이전 스크립트: MySQL(board-new와 같은 DB) → MongoDB(board_nest)
// 실행:  node scripts/migrate-mysql-to-mongo.js
// - MySQL은 읽기(SELECT)만 한다.
// - 대상 컬렉션에 이미 데이터가 있으면 아무것도 하지 않고 멈춘다.
require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');

const TABLES = ['users', 'posts', 'comments', 'likes', 'comment_likes'];

(async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017');
    const db = client.db(process.env.MONGO_DB_NAME || 'board_nest');

    try {
        // 1) 이미 데이터가 있으면 중단 (중복 실행 방지)
        for (const name of [...TABLES, 'counters']) {
            const n = await db.collection(name).countDocuments();
            if (n > 0) {
                console.log(`중단: ${db.databaseName}.${name} 에 이미 ${n}건이 있습니다. 아무것도 변경하지 않았습니다.`);
                return;
            }
        }

        // 2) 인덱스 먼저 (src/config/db.ts 의 ensureIndexes 와 같은 내용)
        await db.collection('users').createIndex({ id: 1 }, { unique: true });
        await db.collection('users').createIndex({ username: 1 }, { unique: true });
        await db.collection('posts').createIndex({ id: 1 }, { unique: true });
        await db.collection('comments').createIndex({ id: 1 }, { unique: true });
        await db.collection('likes').createIndex({ post_id: 1, user_id: 1 }, { unique: true });
        await db.collection('comment_likes').createIndex({ comment_id: 1, user_id: 1 }, { unique: true });

        // 3) 표 → 컬렉션 복사 (행을 그대로 문서로)
        const counters = [];
        for (const table of TABLES) {
            const [rows] = await pool.query(`SELECT * FROM ${table}`);
            const docs = rows.map((r) => ({ ...r }));
            if (docs.length > 0) await db.collection(table).insertMany(docs);
            console.log(`${table}: MySQL ${rows.length}건 → Mongo ${docs.length}건`);

            // 4) id 번호표: 현재 가장 큰 id 를 기억해 둔다 (다음 새 글은 그 다음 번호)
            if (['users', 'posts', 'comments'].includes(table)) {
                const max = docs.reduce((m, d) => Math.max(m, d.id), 0);
                counters.push({ _id: table, seq: max });
            }
        }
        await db.collection('counters').insertMany(counters);
        console.log('counters:', JSON.stringify(counters));
        console.log('완료');
    } finally {
        await pool.end();
        await client.close();
    }
})().catch((e) => {
    console.error('실패:', e.message);
    process.exit(1);
});
