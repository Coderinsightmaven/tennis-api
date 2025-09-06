import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TennisService } from './tennis.service';
import type { TennisMatch } from './tennis.interface';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('tennis')
@UseGuards(ApiKeyGuard)
export class TennisController {
  constructor(private readonly tennisService: TennisService) {}

  @Get()
  async findAll(): Promise<TennisMatch[]> {
    return this.tennisService.findAll();
  }

  @Get('current')
  async getCurrentMatch(): Promise<TennisMatch | undefined> {
    return this.tennisService.getCurrentMatch();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TennisMatch | undefined> {
    return this.tennisService.findOne(id);
  }

  @Post()
  async create(@Body() matchData: any): Promise<TennisMatch> {
    // Validate required scoreboardId
    if (!matchData.scoreboardId) {
      throw new Error('scoreboardId is required');
    }

    // Transform the incoming payload to match our interface
    const transformedData = {
      scoreStringSide1: matchData.scoreStringSide1,
      scoreStringSide2: matchData.scoreStringSide2,
      side1PointScore: matchData.side1PointScore,
      side2PointScore: matchData.side2PointScore,
      sets: matchData.sets.map(set => ({
        setNumber: set.setNumber,
        side1Score: set.side1Score,
        side2Score: set.side2Score,
        winningSide: set.winningSide,
      })),
      server: {
        sideNumber: matchData.server.sideNumber,
        playerNumber: matchData.server.playerNumber,
        returningSide: matchData.server.returningSide,
      },
      player1Name: matchData.player1Name,
      player2Name: matchData.player2Name,
      scoreboardId: matchData.scoreboardId,
    };

    return this.tennisService.create(transformedData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() matchData: any): Promise<TennisMatch | null> {
    // Validate required scoreboardId
    if (!matchData.scoreboardId) {
      throw new Error('scoreboardId is required');
    }

    const transformedData = {
      scoreStringSide1: matchData.scoreStringSide1,
      scoreStringSide2: matchData.scoreStringSide2,
      side1PointScore: matchData.side1PointScore,
      side2PointScore: matchData.side2PointScore,
      sets: matchData.sets.map(set => ({
        setNumber: set.setNumber,
        side1Score: set.side1Score,
        side2Score: set.side2Score,
        winningSide: set.winningSide,
      })),
      server: {
        sideNumber: matchData.server.sideNumber,
        playerNumber: matchData.server.playerNumber,
        returningSide: matchData.server.returningSide,
      },
      player1Name: matchData.player1Name,
      player2Name: matchData.player2Name,
      scoreboardId: matchData.scoreboardId,
    };

    return this.tennisService.update(id, transformedData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    const success = await this.tennisService.delete(id);
    return {
      success,
      message: success ? 'Match deleted successfully' : 'Match not found'
    };
  }
}
