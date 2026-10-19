# board-new2

Express + MySQL 게시판(`board-new`)을 **NestJS + MongoDB**로 옮긴 게시판 프로젝트입니다.
기존 API 주소, HTTP 메서드, 응답 형태, 에러 메시지는 그대로 유지하고 프레임워크와 DB만 바꿨습니다.

## 기능

- 회원가입 / 로그인 (bcrypt 해시, JWT 1시간)
- 게시글 목록 / 상세(조회수 증가) / 작성 / 수정 / 삭제
- 이미지 업로드 (jpg, jpeg, png, gif, 최대 2MB)
- 댓글 작성 / 수정 / 삭제, **대댓글**
  - 대댓글이 달린 댓글을 삭제하면 `삭제된 댓글입니다.`로 표시되고 대댓글은 유지됩니다.
- 글 좋아요, 댓글 좋아요 (토글 방식)
- 정적 화면 (`public/`): 목록, 상세, 작성, 수정, 로그인, 회원가입

## 기술 스택

| 구분 | 사용 |
|---|---|
| 프레임워크 | NestJS |
| 언어 | TypeScript |
| DB | MongoDB (공식 `mongodb` 드라이버, ORM 없음) |
| 인증 | JWT (`jsonwebtoken`), `bcrypt` |
| 업로드 | Multer (`FileInterceptor`) |

## 시작하기

### 1. 준비물
- Node.js
- 실행 중인 MongoDB (기본: `mongodb://localhost:27017`)

### 2. 설치
```bash
npm install
```

### 3. 환경변수
프로젝트 루트에 `.env` 파일을 만들고 아래 값을 채웁니다. (`.env`는 git에 올라가지 않습니다.)

```env
PORT=3000
JWT_SECRET=원하는_비밀_문자열
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=board_nest
```

### 4. 실행
```bash
npm run start        # 한 번 실행
npm run start:dev    # 코드를 고치면 자동으로 다시 시작
```

실행 후 `http://localhost:3000` 에 접속하면 화면이 열립니다.

> 서버가 시작될 때 MongoDB 인덱스(아이디 중복 방지 등)가 자동으로 만들어집니다.

## API

인증이 필요한 요청은 헤더에 `Authorization: Bearer <토큰>`을 넣습니다.

### 인증
| 메서드 | 주소 | 설명 | 인증 |
|---|---|---|---|
| POST | `/auth/register` | 회원가입 | - |
| POST | `/auth/login` | 로그인 (토큰 발급) | - |

### 게시글
| 메서드 | 주소 | 설명 | 인증 |
|---|---|---|---|
| GET | `/posts` | 글 목록 | - |
| GET | `/posts/:id` | 글 상세 (조회수 +1) | - |
| POST | `/posts` | 글 작성 (`multipart/form-data`: title, content, image) | 필요 |
| PUT | `/posts/:id` | 글 수정 (본인만) | 필요 |
| DELETE | `/posts/:id` | 글 삭제 (본인만, 댓글·좋아요도 함께 삭제) | 필요 |
| GET | `/posts/:id/likes` | 글 좋아요 목록 | - |
| POST | `/posts/:id/likes` | 글 좋아요 토글 | 필요 |

### 댓글
| 메서드 | 주소 | 설명 | 인증 |
|---|---|---|---|
| GET | `/comments/:post_id` | 댓글 목록 (대댓글 포함, `parent_id`로 구분) | - |
| POST | `/comments/:post_id` | 댓글 작성 (`content`, 대댓글이면 `parent_id`도) | 필요 |
| PUT | `/comments/:id` | 댓글 수정 (본인만) | 필요 |
| DELETE | `/comments/:id` | 댓글 삭제 (본인만) | 필요 |
| GET | `/comments/:id/likes` | 댓글 좋아요 목록 | - |
| POST | `/comments/:id/likes` | 댓글 좋아요 토글 | 필요 |

## 폴더 구조

```
src/
├─ main.ts                 서버 시작 (Express의 app.js 역할)
├─ app.module.ts           모듈 등록
├─ config/
│   ├─ db.ts               MongoDB 연결, id 발급, 인덱스
│   └─ upload.ts           Multer 설정
├─ auth/                   회원가입·로그인, JWT 가드(auth.guard.ts)
├─ posts/                  게시글
├─ comments/               댓글·대댓글·댓글 좋아요
├─ likes/                  글 좋아요
└─ utils/                  AppError, 에러 응답 필터
public/                    정적 화면(html), uploads/ (업로드 이미지)
scripts/                   MySQL → MongoDB 1회용 이전 스크립트
```

요청 흐름은 `Controller → Service → MongoDB` 입니다.

| Express (board-new) | NestJS (board-new2) |
|---|---|
| `routes` + `controllers` | `*.controller.ts` |
| `services` | `*.service.ts` |
| `middlewares/authMiddleware` | `auth/auth.guard.ts` |
| `config/upload.js` | `config/upload.ts` + `FileInterceptor` |
| `utils/AppError`, `handleError` | `utils/AppError.ts`, `utils/handleError.ts` |

## 데이터 (컬렉션)

| 컬렉션 | 내용 |
|---|---|
| `users` | 계정 (비밀번호는 bcrypt 해시) |
| `posts` | 게시글 |
| `comments` | 댓글, 대댓글(`parent_id`), 삭제 표시(`is_deleted`) |
| `likes` | 글 좋아요 |
| `comment_likes` | 댓글 좋아요 |
| `counters` | 새 글·댓글·계정에 붙일 숫자 id 발급용 |

문서의 `id`는 MySQL 때와 같은 **숫자**를 그대로 씁니다.

## 기존 MySQL 데이터 옮기기 (선택)

`board-new`의 MySQL 데이터를 가져오려면 `.env`에 기존 접속 정보를 추가하고 한 번만 실행합니다.

```env
DB_HOST=...
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
```

```bash
node scripts/migrate-mysql-to-mongo.js
```

- MySQL은 읽기만 합니다.
- 대상 MongoDB에 이미 데이터가 있으면 아무것도 하지 않고 멈춥니다.

## 참고

- `posts.controller.ts`의 `practice/*` 경로와 `/posts/:id/views`, `/posts/:id/title`은 NestJS 학습용 연습 API입니다.
