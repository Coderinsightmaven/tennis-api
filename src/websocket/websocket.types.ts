// WebSocket Event Types
export enum WebSocketEvents {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',

  // Scoreboard events
  SCOREBOARD_CREATED = 'scoreboard:created',
  SCOREBOARD_UPDATED = 'scoreboard:updated',
  SCOREBOARD_DELETED = 'scoreboard:deleted',

  // Tennis match events
  TENNIS_MATCH_CREATED = 'tennis:match:created',
  TENNIS_MATCH_UPDATED = 'tennis:match:updated',
  TENNIS_MATCH_DELETED = 'tennis:match:deleted',

  // Request events
  GET_SCOREBOARDS = 'get:scoreboards',
  GET_TENNIS_MATCH = 'get:tennis:match',
  CREATE_SCOREBOARD = 'create:scoreboard',
  UPDATE_TENNIS_MATCH = 'update:tennis:match',
  DELETE_SCOREBOARD = 'delete:scoreboard',

  // Response events
  SCOREBOARDS_RESPONSE = 'scoreboards:response',
  TENNIS_MATCH_RESPONSE = 'tennis:match:response',
  ERROR_RESPONSE = 'error:response',
}

export interface WebSocketMessage<T = any> {
  event: WebSocketEvents;
  data: T;
  timestamp: Date;
  requestId?: string;
}

export interface WebSocketError {
  code: string;
  message: string;
  details?: any;
}

export interface WebSocketRequest<T = any> {
  requestId: string;
  data: T;
}

export interface WebSocketResponse<T = any> {
  requestId: string;
  success: boolean;
  data?: T;
  error?: WebSocketError;
}

export interface Scoreboard {
  id: string;
  name: string;
}

export interface CreateScoreboardData {
  name: string;
}

export interface TennisMatch {
  id: string;
  scoreStringSide1: string;
  scoreStringSide2: string;
  side1PointScore: string;
  side2PointScore: string;
  sets: Array<{
    setNumber: number;
    side1Score: number;
    side2Score: number;
    winningSide?: number;
  }>;
  server: {
    sideNumber: number;
    playerNumber: number;
    returningSide: string;
  };
  player1Name?: string;
  player2Name?: string;
  scoreboardId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTennisMatchData {
  scoreStringSide1: string;
  scoreStringSide2: string;
  side1PointScore: string;
  side2PointScore: string;
  sets: Array<{
    setNumber: number;
    side1Score: number;
    side2Score: number;
    winningSide?: number;
  }>;
  server: {
    sideNumber: number;
    playerNumber: number;
    returningSide: string;
  };
  player1Name?: string;
  player2Name?: string;
  scoreboardId: string;
}
