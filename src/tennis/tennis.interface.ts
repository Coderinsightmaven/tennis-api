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
