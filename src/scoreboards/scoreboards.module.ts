import { Module, forwardRef } from '@nestjs/common';
import { ScoreboardsController } from './scoreboards.controller';
import { ScoreboardsService } from './scoreboards.service';
import { TennisModule } from '../tennis/tennis.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [TennisModule, forwardRef(() => WebSocketModule)],
  controllers: [ScoreboardsController],
  providers: [ScoreboardsService],
  exports: [ScoreboardsService],
})
export class ScoreboardsModule {}
