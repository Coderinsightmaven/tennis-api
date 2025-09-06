import { Module } from '@nestjs/common';
import { ScoreboardsController } from './scoreboards.controller';
import { ScoreboardsService } from './scoreboards.service';
import { TennisModule } from '../tennis/tennis.module';

@Module({
  imports: [TennisModule],
  controllers: [ScoreboardsController],
  providers: [ScoreboardsService],
  exports: [ScoreboardsService],
})
export class ScoreboardsModule {}
