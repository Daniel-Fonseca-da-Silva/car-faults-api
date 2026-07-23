import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnownIssuesModule } from '../known-issues/known-issues.module';
import { CommentsController } from './comments.controller';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), KnownIssuesModule],
  controllers: [CommentsController],
  providers: [CommentsRepository, CommentsService],
})
export class CommentsModule {}
