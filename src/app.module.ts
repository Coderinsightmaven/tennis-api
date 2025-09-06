import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScoreboardsModule } from './scoreboards/scoreboards.module';
import { AuthModule } from './auth/auth.module';
import { TennisModule } from './tennis/tennis.module';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [ScoreboardsModule, AuthModule, TennisModule, WebSocketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
