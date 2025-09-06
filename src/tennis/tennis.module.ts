import { Module, forwardRef } from '@nestjs/common';
import { TennisController } from './tennis.controller';
import { TennisService } from './tennis.service';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [forwardRef(() => WebSocketModule)],
  controllers: [TennisController],
  providers: [TennisService],
  exports: [TennisService],
})
export class TennisModule {}
