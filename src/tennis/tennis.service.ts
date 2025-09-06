import { Injectable, OnModuleInit } from '@nestjs/common';
import { TennisMatch, CreateTennisMatchData } from './tennis.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class TennisService implements OnModuleInit {
  private matches: TennisMatch[] = [];
  private readonly dataFile = path.join(process.cwd(), 'data', 'tennis-matches-data.json');

  async onModuleInit() {
    await this.loadMatchesFromFile();
  }

  private async loadMatchesFromFile() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf-8');
      this.matches = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, initialize with empty array
      this.matches = [];
      await this.saveMatchesToFile();
    }
  }

  private async saveMatchesToFile() {
    try {
      await fs.writeFile(this.dataFile, JSON.stringify(this.matches, null, 2));
    } catch (error) {
      console.error('Failed to save matches to file:', error);
    }
  }

  async findAll(): Promise<TennisMatch[]> {
    return this.matches;
  }

  async findOne(id: string): Promise<TennisMatch | undefined> {
    return this.matches.find(match => match.id === id);
  }

  async create(matchData: CreateTennisMatchData): Promise<TennisMatch> {
    // Clean up old matches for the same scoreboard before creating new one
    if (matchData.scoreboardId) {
      await this.cleanupOldMatches(matchData.scoreboardId);
    }

    const newMatch: TennisMatch = {
      ...matchData,
      id: (this.matches.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.matches.push(newMatch);
    await this.saveMatchesToFile();
    return newMatch;
  }

  async update(id: string, matchData: CreateTennisMatchData): Promise<TennisMatch | null> {
    const index = this.matches.findIndex(match => match.id === id);
    if (index !== -1) {
      this.matches[index] = {
        ...this.matches[index],
        ...matchData,
        updatedAt: new Date(),
      };

      // Clean up old matches for the same scoreboard after update
      if (matchData.scoreboardId) {
        await this.cleanupOldMatches(matchData.scoreboardId, id);
      }

      await this.saveMatchesToFile();
      return this.matches[index];
    }
    return null;
  }

  private async cleanupOldMatches(scoreboardId: string, excludeId?: string): Promise<void> {
    // Keep only the most recent match for each scoreboard
    const scoreboardMatches = this.matches
      .filter(match => match.scoreboardId === scoreboardId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    if (scoreboardMatches.length > 1) {
      // Remove all but the most recent match for this scoreboard
      const matchesToRemove = scoreboardMatches.slice(1);
      this.matches = this.matches.filter(match =>
        !matchesToRemove.some(removeMatch => removeMatch.id === match.id)
      );
    }
  }

  async delete(id: string): Promise<boolean> {
    const index = this.matches.findIndex(match => match.id === id);
    if (index !== -1) {
      this.matches.splice(index, 1);
      await this.saveMatchesToFile();
      return true;
    }
    return false;
  }

  async getCurrentMatch(): Promise<TennisMatch | undefined> {
    // Return the most recently updated match
    return this.matches
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  }
}
