import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { PhotosModule } from './photos/photos.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';

@Module({
    imports: [AuthModule, PostsModule, CommentsModule, LikesModule, PhotosModule, BookmarksModule],
    controllers: [AppController],
})
export class AppModule {}
