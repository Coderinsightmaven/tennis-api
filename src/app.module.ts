import { Module } from '@nestjs/common';
import { ScoreboardsModule } from './scoreboards/scoreboards.module';
import { AuthModule } from './auth/auth.module';
import { TennisModule } from './tennis/tennis.module';

@Module({
  imports: [ScoreboardsModule, AuthModule, TennisModule],
})
export class AppModule {}
