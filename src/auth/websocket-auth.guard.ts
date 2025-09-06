import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class WebSocketAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const apiKey = client.handshake.auth?.['x-api-key'] as string;

    // Use environment variable or fallback to default for development
    const validApiKey = process.env.API_KEY || 'dev-api-key-12345';

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
