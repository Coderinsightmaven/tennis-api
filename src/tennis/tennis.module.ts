import { Module } from '@nestjs/common';
import { TennisController } from './tennis.controller';
import { TennisService } from './tennis.service';

@Module({
  controllers: [TennisController],
  providers: [TennisService],
  exports: [TennisService],
})
export class TennisModule {}
