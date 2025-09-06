import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { WebSocketAuthGuard } from '../auth/websocket-auth.guard';
import { WebSocketEvents } from './websocket.types';
import type {
  WebSocketMessage,
  WebSocketRequest,
  WebSocketResponse,
  Scoreboard,
  CreateScoreboardData,
  TennisMatch,
} from './websocket.types';
import { ScoreboardsService } from '../scoreboards/scoreboards.service';
import { TennisService } from '../tennis/tennis.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // In production, specify your frontend URL
    credentials: true,
  },
  namespace: '/',
})
export class WebSocketGatewayService implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebSocketGateway');

  constructor(
    private readonly scoreboardsService: ScoreboardsService,
    private readonly tennisService: TennisService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private emitToAll(event: WebSocketEvents, data: any) {
    this.server.emit(event, {
      event,
      data,
      timestamp: new Date(),
    } as WebSocketMessage);
  }

  private emitToClient(client: Socket, event: WebSocketEvents, response: WebSocketResponse) {
    client.emit(event, {
      event,
      ...response,
      timestamp: new Date(),
    } as WebSocketMessage);
  }

  @UseGuards(WebSocketAuthGuard)
  @SubscribeMessage(WebSocketEvents.GET_SCOREBOARDS)
  async handleGetScoreboards(
    @MessageBody() request: WebSocketRequest,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const scoreboards = await this.scoreboardsService.findAll();
      const response: WebSocketResponse<Scoreboard[]> = {
        requestId: request.requestId,
        success: true,
        data: scoreboards,
      };
      this.emitToClient(client, WebSocketEvents.SCOREBOARDS_RESPONSE, response);
    } catch (error) {
      const response: WebSocketResponse = {
        requestId: request.requestId,
        success: false,
        error: {
          code: 'GET_SCOREBOARDS_FAILED',
          message: 'Failed to fetch scoreboards',
          details: error.message,
        },
      };
      this.emitToClient(client, WebSocketEvents.ERROR_RESPONSE, response);
    }
  }

  @UseGuards(WebSocketAuthGuard)
  @SubscribeMessage(WebSocketEvents.CREATE_SCOREBOARD)
  async handleCreateScoreboard(
    @MessageBody() request: WebSocketRequest<CreateScoreboardData>,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const scoreboard = await this.scoreboardsService.create(request.data.name);
      const response: WebSocketResponse<Scoreboard> = {
        requestId: request.requestId,
        success: true,
        data: scoreboard,
      };
      this.emitToClient(client, WebSocketEvents.SCOREBOARDS_RESPONSE, response);

      // Broadcast to all clients that a new scoreboard was created
      this.emitToAll(WebSocketEvents.SCOREBOARD_CREATED, scoreboard);
    } catch (error) {
      const response: WebSocketResponse = {
        requestId: request.requestId,
        success: false,
        error: {
          code: 'CREATE_SCOREBOARD_FAILED',
          message: 'Failed to create scoreboard',
          details: error.message,
        },
      };
      this.emitToClient(client, WebSocketEvents.ERROR_RESPONSE, response);
    }
  }

  @UseGuards(WebSocketAuthGuard)
  @SubscribeMessage(WebSocketEvents.DELETE_SCOREBOARD)
  async handleDeleteScoreboard(
    @MessageBody() request: WebSocketRequest<{ id: string }>,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const success = await this.scoreboardsService.delete(request.data.id);
      const response: WebSocketResponse<{ success: boolean; message: string }> = {
        requestId: request.requestId,
        success: true,
        data: {
          success,
          message: success ? 'Scoreboard deleted successfully' : 'Scoreboard not found'
        },
      };
      this.emitToClient(client, WebSocketEvents.SCOREBOARDS_RESPONSE, response);

      // Broadcast to all clients that a scoreboard was deleted
      this.emitToAll(WebSocketEvents.SCOREBOARD_DELETED, { id: request.data.id });
    } catch (error) {
      const response: WebSocketResponse = {
        requestId: request.requestId,
        success: false,
        error: {
          code: 'DELETE_SCOREBOARD_FAILED',
          message: 'Failed to delete scoreboard',
          details: error.message,
        },
      };
      this.emitToClient(client, WebSocketEvents.ERROR_RESPONSE, response);
    }
  }

  @UseGuards(WebSocketAuthGuard)
  @SubscribeMessage(WebSocketEvents.GET_TENNIS_MATCH)
  async handleGetTennisMatch(
    @MessageBody() request: WebSocketRequest<{ scoreboardId: string }>,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const matches = await this.tennisService.findAll();
      const match = matches.find(m => m.scoreboardId === request.data.scoreboardId) || null;
      const response: WebSocketResponse<TennisMatch | null> = {
        requestId: request.requestId,
        success: true,
        data: match,
      };
      this.emitToClient(client, WebSocketEvents.TENNIS_MATCH_RESPONSE, response);
    } catch (error) {
      const response: WebSocketResponse = {
        requestId: request.requestId,
        success: false,
        error: {
          code: 'GET_TENNIS_MATCH_FAILED',
          message: 'Failed to fetch tennis match',
          details: error.message,
        },
      };
      this.emitToClient(client, WebSocketEvents.ERROR_RESPONSE, response);
    }
  }

  @UseGuards(WebSocketAuthGuard)
  @SubscribeMessage(WebSocketEvents.UPDATE_TENNIS_MATCH)
  async handleUpdateTennisMatch(
    @MessageBody() request: WebSocketRequest<{ scoreboardId: string; matchData: Partial<TennisMatch> }>,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      // Find existing match first
      const matches = await this.tennisService.findAll();
      const existingMatch = matches.find(m => m.scoreboardId === request.data.scoreboardId);

      if (!existingMatch) {
        throw new Error('No tennis match found for this scoreboard');
      }

      // Update the match with the provided data
      const updatedMatchData = {
        scoreStringSide1: request.data.matchData.scoreStringSide1 ?? existingMatch.scoreStringSide1,
        scoreStringSide2: request.data.matchData.scoreStringSide2 ?? existingMatch.scoreStringSide2,
        side1PointScore: request.data.matchData.side1PointScore ?? existingMatch.side1PointScore,
        side2PointScore: request.data.matchData.side2PointScore ?? existingMatch.side2PointScore,
        sets: request.data.matchData.sets ?? existingMatch.sets,
        server: request.data.matchData.server ?? existingMatch.server,
        player1Name: request.data.matchData.player1Name ?? existingMatch.player1Name,
        player2Name: request.data.matchData.player2Name ?? existingMatch.player2Name,
        scoreboardId: request.data.scoreboardId,
      };

      const match = await this.tennisService.update(existingMatch.id, updatedMatchData);
      const response: WebSocketResponse<TennisMatch | null> = {
        requestId: request.requestId,
        success: true,
        data: match,
      };
      this.emitToClient(client, WebSocketEvents.TENNIS_MATCH_RESPONSE, response);

      // Broadcast to all clients that the tennis match was updated
      this.emitToAll(WebSocketEvents.TENNIS_MATCH_UPDATED, match);
    } catch (error) {
      const response: WebSocketResponse = {
        requestId: request.requestId,
        success: false,
        error: {
          code: 'UPDATE_TENNIS_MATCH_FAILED',
          message: 'Failed to update tennis match',
          details: error.message,
        },
      };
      this.emitToClient(client, WebSocketEvents.ERROR_RESPONSE, response);
    }
  }

  // Public methods that can be called by controllers to emit events
  emitScoreboardCreated(scoreboard: Scoreboard) {
    this.emitToAll(WebSocketEvents.SCOREBOARD_CREATED, scoreboard);
  }

  emitScoreboardDeleted(id: string) {
    this.emitToAll(WebSocketEvents.SCOREBOARD_DELETED, { id });
  }

  emitTennisMatchUpdated(match: TennisMatch) {
    this.emitToAll(WebSocketEvents.TENNIS_MATCH_UPDATED, match);
  }

  emitTennisMatchCreated(match: TennisMatch) {
    this.emitToAll(WebSocketEvents.TENNIS_MATCH_CREATED, match);
  }

  emitTennisMatchDeleted(id: string) {
    this.emitToAll(WebSocketEvents.TENNIS_MATCH_DELETED, { id });
  }
}
