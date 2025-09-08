import { Injectable, OnModuleInit } from '@nestjs/common';
import { Scoreboard } from './scoreboard.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ScoreboardsService implements OnModuleInit {
  private scoreboards: Scoreboard[] = [];
  private readonly dataFile = path.join(process.cwd(), 'data', 'scoreboards-data.json');

  async onModuleInit() {
    await this.loadScoreboardsFromFile();
  }

  private async loadScoreboardsFromFile() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf-8');
      const parsedData = JSON.parse(data);
      // Migrate existing data to simplified format if needed
      this.scoreboards = parsedData.map((scoreboard: any, index: number) => ({
        id: scoreboard.id || (index + 1).toString(),
        name: scoreboard.name || scoreboard.courtname || `Scoreboard ${index + 1}`
      }));
    } catch (error) {
      // If file doesn't exist, initialize with default data
      this.scoreboards = [
        { id: this.generateRandomId(), name: 'Stadium Scoreboard' },
        { id: this.generateRandomId(), name: 'Grandstand Scoreboard' },
      ];
      await this.saveScoreboardsToFile();
    }
  }

  private async saveScoreboardsToFile() {
    try {
      await fs.writeFile(this.dataFile, JSON.stringify(this.scoreboards, null, 2));
    } catch (error) {
      console.error('Failed to save scoreboards to file:', error);
    }
  }

  findAll(): Scoreboard[] {
    return this.scoreboards;
  }

  findOne(id: string): Scoreboard | undefined {
    return this.scoreboards.find(scoreboard => scoreboard.id === id);
  }

  private generateRandomId(): string {
    // Generate a random 8-character alphanumeric ID
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async create(scoreboardName: string): Promise<Scoreboard> {
    const newScoreboard: Scoreboard = {
      id: this.generateRandomId(),
      name: scoreboardName,
    };
    this.scoreboards.push(newScoreboard);
    await this.saveScoreboardsToFile();
    return newScoreboard;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.scoreboards.findIndex(scoreboard => scoreboard.id === id);
    if (index !== -1) {
      this.scoreboards.splice(index, 1);
      await this.saveScoreboardsToFile();
      return true;
    }
    return false;
  }

  async updateAll(scoreboards: Scoreboard[]): Promise<Scoreboard[]> {
    // Validate the input data
    if (!Array.isArray(scoreboards)) {
      throw new Error('Scoreboards data must be an array');
    }

    // Validate each scoreboard has required fields
    for (const scoreboard of scoreboards) {
      if (!scoreboard.id || typeof scoreboard.id !== 'string') {
        throw new Error('Each scoreboard must have a valid id');
      }
      if (!scoreboard.name || typeof scoreboard.name !== 'string') {
        throw new Error('Each scoreboard must have a valid name');
      }
    }

    this.scoreboards = [...scoreboards];
    await this.saveScoreboardsToFile();
    return this.scoreboards;
  }
}
