import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ScoreboardsService } from './scoreboards.service';
import { TennisService } from '../tennis/tennis.service';
import type { Scoreboard } from './scoreboard.interface';
import type { TennisMatch } from '../tennis/tennis.interface';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';

@Controller('scoreboards')
@UseGuards(ApiKeyGuard)
export class ScoreboardsController {
  constructor(
    private readonly scoreboardsService: ScoreboardsService,
    private readonly tennisService: TennisService,
    private readonly webSocketGateway: WebSocketGatewayService,
  ) {}

  @Get()
  findAll(): Scoreboard[] {
    return this.scoreboardsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Scoreboard | undefined {
    return this.scoreboardsService.findOne(id);
  }

  @Post()
  async create(@Body() body: { name: string }): Promise<Scoreboard> {
    const scoreboard = await this.scoreboardsService.create(body.name);
    // Emit WebSocket event for real-time updates
    this.webSocketGateway.emitScoreboardCreated(scoreboard);
    return scoreboard;
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    const success = await this.scoreboardsService.delete(id);
    if (success) {
      // Emit WebSocket event for real-time updates
      this.webSocketGateway.emitScoreboardDeleted(id);
    }
    return {
      success,
      message: success ? 'Scoreboard deleted successfully' : 'Scoreboard not found'
    };
  }

  @Put()
  async updateAll(@Body() scoreboards: Scoreboard[]): Promise<{ success: boolean; data: Scoreboard[]; message: string }> {
    try {
      const updatedScoreboards = await this.scoreboardsService.updateAll(scoreboards);
      // Emit WebSocket event for real-time updates
      this.webSocketGateway.emitScoreboardsUpdated(updatedScoreboards);
      return {
        success: true,
        data: updatedScoreboards,
        message: 'Scoreboards updated successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update scoreboards',
          data: []
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':id/tennis')
  async updateTennisMatch(@Param('id') scoreboardId: string, @Body() matchData: any): Promise<TennisMatch> {
    // Validate that the scoreboard exists
    const scoreboard = this.scoreboardsService.findOne(scoreboardId);
    if (!scoreboard) {
      throw new Error(`Scoreboard with id ${scoreboardId} not found`);
    }

    // Find existing tennis match for this scoreboard
    const existingMatches = await this.tennisService.findAll();
    const existingMatch = existingMatches.find(match => match.scoreboardId === scoreboardId);

    // Transform the incoming payload to match our interface
    const transformedData = {
      scoreStringSide1: matchData.scoreStringSide1,
      scoreStringSide2: matchData.scoreStringSide2,
      side1PointScore: matchData.side1PointScore,
      side2PointScore: matchData.side2PointScore,
      sets: matchData.sets?.map((set: any) => ({
        setNumber: set.setNumber,
        side1Score: set.side1Score,
        side2Score: set.side2Score,
        winningSide: set.winningSide,
      })) || [],
      server: {
        sideNumber: matchData.server?.sideNumber,
        playerNumber: matchData.server?.playerNumber,
        returningSide: matchData.server?.returningSide,
      },
      player1Name: matchData.player1Name,
      player2Name: matchData.player2Name,
      scoreboardId: scoreboardId,
    };

    if (existingMatch) {
      console.log('📝 Updating existing tennis match for scoreboard:', scoreboardId);
      // Update existing match
      const updatedMatch = await this.tennisService.update(existingMatch.id, transformedData);
      console.log('✅ Tennis match updated:', updatedMatch);
      console.log('🔍 Updated match scoreboardId:', updatedMatch?.scoreboardId);
      console.log('🔍 Updated match data keys:', updatedMatch ? Object.keys(updatedMatch) : 'null');
      // Emit WebSocket event for real-time updates
      this.webSocketGateway.emitTennisMatchUpdated(updatedMatch || existingMatch);
      return updatedMatch || existingMatch;
    } else {
      console.log('📝 Creating new tennis match for scoreboard:', scoreboardId);
      // Create new match
      const newMatch = await this.tennisService.create(transformedData);
      console.log('✅ Tennis match created:', newMatch);
      console.log('🔍 New match scoreboardId:', newMatch?.scoreboardId);
      console.log('🔍 New match data keys:', newMatch ? Object.keys(newMatch) : 'null');
      // Emit WebSocket event for real-time updates
      this.webSocketGateway.emitTennisMatchCreated(newMatch);
      return newMatch;
    }
  }

  @Get(':id/tennis')
  async getTennisMatch(@Param('id') scoreboardId: string): Promise<TennisMatch | null> {
    // Validate that the scoreboard exists
    const scoreboard = this.scoreboardsService.findOne(scoreboardId);
    if (!scoreboard) {
      throw new HttpException(`Scoreboard with id ${scoreboardId} not found`, HttpStatus.NOT_FOUND);
    }

    // Find tennis match for this scoreboard
    const matches = await this.tennisService.findAll();
    return matches.find(match => match.scoreboardId === scoreboardId) || null;
  }
}
