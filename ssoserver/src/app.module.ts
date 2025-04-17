import * as crypto from 'crypto';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AppController } from './app.controller';
import { ClientsController } from './clients/clients.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/controllers/auth.controller';
import { AuthService } from './auth/services/auth.service';
import { TokenService } from './auth/services/token.service';
import { UsersService } from './users/users.service';
import { SessionsService } from './sessions/sessions.service';
import { ClientsService } from './clients/clients.service';

// Entities
import { User } from './users/entities/user.entity';
import { OAuthClient } from './clients/entities/client.entity';
import { OAuthCode } from './sessions/entities/code.entity';
import { UserSession } from './sessions/entities/session.entity';
import { LoginController } from './auth/controllers/login.controller';

@Module({
  imports: [
    // Configuration module (loads .env)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', '123456'),
        database: configService.get<string>('DB_NAME', 'sso_idp'),
        entities: [User, OAuthClient, OAuthCode, UserSession],
        synchronize: configService.get<boolean>('DB_SYNC', true), // false in production
      }),
    }),

    // JWT Module
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
        },
      }),
    }),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Feature modules
    TypeOrmModule.forFeature([User, OAuthClient, OAuthCode, UserSession]),
  ],
  controllers: [AppController, AuthController,ClientsController,LoginController ],
  providers: [
    AppService,
    AuthService,
    TokenService,
    UsersService,
    SessionsService,
    ClientsService,
  ],
})
export class AppModule {}