import { Module, forwardRef } from '@nestjs/common';
import { WebSocketGatewayService } from './websocket.gateway';
import { ScoreboardsModule } from '../scoreboards/scoreboards.module';
import { TennisModule } from '../tennis/tennis.module';

@Module({
  imports: [forwardRef(() => ScoreboardsModule), forwardRef(() => TennisModule)],
  providers: [WebSocketGatewayService],
  exports: [WebSocketGatewayService],
})
export class WebSocketModule {}
