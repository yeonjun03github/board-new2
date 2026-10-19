import { diskStorage } from 'multer';
import * as path from 'path';

// 기존 config/upload.js의 multer 옵션 그대로.
// Express: upload.single('image')  →  Nest: FileInterceptor('image', uploadOptions)
export const uploadOptions = {
    storage: diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'public/uploads/');
        },
        filename: (req, file, cb) => {
            const uniqueName = Date.now() + path.extname(file.originalname);
            cb(null, uniqueName);
        },
    }),
    fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 },
};
