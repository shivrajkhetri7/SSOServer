import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { OAuthCode } from '../sessions/entities/code.entity';
import { UserSession } from '../sessions/entities/session.entity';
import { User } from '../users/entities/user.entity';
import { OAuthClient } from '../clients/entities/client.entity';
import { SessionsService } from '../sessions/sessions.service';
import { ClientsService } from '../clients/clients.service';
import { UsersService } from '../users/users.service';
import { ClientsController } from 'src/clients/clients.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'oidc' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('ACCESS_TOKEN_EXPIRES_IN', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([OAuthCode, UserSession, User, OAuthClient]),
    ConfigModule,
  ],
  controllers: [AuthController,ClientsController],
  providers: [
    AuthService,
    TokenService,
    SessionsService,
    ClientsService,
    UsersService,
    {
      provide: 'OAUTH2_STRATEGY_OPTIONS',
      useFactory: (configService: ConfigService) => ({
        issuer: configService.get<string>('AUTH_ISSUER'),
        clientID: configService.get<string>('AUTH0_CLIENT_ID'),
        clientSecret: configService.get<string>('AUTH0_CLIENT_SECRET'),
        callbackURL: configService.get<string>('AUTH0_CALLBACK_URL'),
        scope: 'openid profile email',
      }),
      inject: [ConfigService],
    },
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}