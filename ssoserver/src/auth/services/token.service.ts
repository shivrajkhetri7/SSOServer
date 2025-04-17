import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuthClient } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(user: User, client: OAuthClient, scope: string): Promise<string> {
    const expiresIn = this.configService.get<any>('auth.accessTokenExpiresIn') ?? '1h'; // e.g., 3600
    // Ensure expiresIn is passed as a string or number representing seconds
    return this.jwtService.sign({
      iss: this.configService.get<string>('auth.issuer'),
      sub: user.id.toString(),
      aud: client.client_id,
      iat: Math.floor(Date.now() / 1000),
      scope,
      client_id: client.client_id,
      auth_time: Math.floor(Date.now() / 1000),
      ...this.getUserClaims(user),
    }, {
      expiresIn: `${expiresIn}`, // Make sure it’s passed as a valid number or string (e.g., "3600" or "1h")
    });
  }
  
  async generateIdToken(user: User, client: OAuthClient, nonce?: string): Promise<string> {
    const expiresIn = this.configService.get<string>('auth.idTokenExpiresIn') ?? '1h'; // fallback to '1h' if undefined
  
    const payload: any = {
      iss: this.configService.get<string>('auth.issuer'),
      sub: user.id.toString(),
      aud: client.client_id,
      iat: Math.floor(Date.now() / 1000),
      auth_time: Math.floor(Date.now() / 1000),
      ...this.getUserClaims(user),
    };
  
    if (nonce) {
      payload.nonce = nonce;
    }
  
    return this.jwtService.sign(payload, {
      expiresIn, // pass directly, no interpolation
    });
  }
  

  async generateRefreshToken(userId: number, clientId: string): Promise<string> {
    const expiresIn = this.configService.get<string>('auth.refreshTokenExpiresIn') ?? '7d'; // fallback to 7 days
    const secret = this.configService.get<string>('auth.refreshTokenSecret');
  
    return this.jwtService.sign({
      sub: userId.toString(),
      client_id: clientId,
      token_type: 'refresh_token',
      iat: Math.floor(Date.now() / 1000),
    }, {
      secret,
      expiresIn, // let JWT handle exp calculation
    });
  }
  

  async validateAccessToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        ignoreExpiration: false,
      });
    } catch (e) {
      throw new Error('Invalid access token');
    }
  }
  async validateRefreshToken(token: string): Promise<{ sub: string; client_id: string }> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('auth.refreshTokenSecret'),
        ignoreExpiration: false,
      });
    } catch (e) {
      throw new Error('Invalid refresh token');
    }
  }

  async validateIdToken(token: string, clientId: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token, {
        ignoreExpiration: false,
      });

      if (payload.aud !== clientId) {
        throw new Error('Invalid audience');
      }

      return payload;
    } catch (e) {
      throw new Error('Invalid ID token');
    }
  }

  private getUserClaims(user: User): any {
    // Create a display name from email (everything before @)
    const displayName = user.email.split('@')[0];
    
    return {
      sub: user.id.toString(),
      name: displayName,
      preferred_username: user.username,
      email: user.email,
      email_verified: false, // You can add this field later
    };
  }
}