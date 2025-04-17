import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthCode } from './entities/code.entity';
import { UserSession } from './entities/session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(OAuthCode)
    private readonly codesRepository: Repository<OAuthCode>,
    @InjectRepository(UserSession)
    private readonly sessionsRepository: Repository<UserSession>,
  ) { }

  // Create an authorization code
  async createAuthorizationCode(params: {
    code: string;
    userId: number;
    clientId: string;
    redirectUri: string;
    expiresAt: Date;
    institute: string;
    tenant?: string;
  }): Promise<OAuthCode> {
    const code = this.codesRepository.create({
      code: params.code,
      user_id: params.userId,
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      expires_at: params.expiresAt,
      institute: params.institute,
      tenant: params.tenant,
    });
    return this.codesRepository.save(code);
  }

  // Validate an authorization code
  async validateAuthorizationCode(
    code: string,
    clientId: string,
    redirectUri: string,
  ): Promise<any> {
    console.log("validations...", code,
      clientId,
      redirectUri)

    const authCode:OAuthCode = await this.codesRepository.findOne({
      where: { code, client_id: clientId },
    });

    console.log('authCode', authCode)

    if (!authCode) {
      throw new Error('Authorization code not found');
    }

    // if (new Date() > authCode?.expires_at) {
    //   await this.sessionsRepository.delete({ id: authCode.id });
    //   throw new Error('Authorization code expired');
    // }

    // if (authCode.redirect_uri !== redirectUri) {
    //   throw new Error('Redirect URI mismatch');
    // }

    // Delete the code after validation (single use)
    // await this.codesRepository.delete({ id: authCode.id });

    return authCode;
  }

  // Create a user session
  async createUserSession(params: {
    userId: number;
    clientId: string;
    institute: string;
    tenant?: string;
  }): Promise<UserSession> {
 
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = this.sessionsRepository.create({
      sessionId,
      userId: params.userId,
      clientId: params.clientId,
      institute: params.institute || 'abc',
      tenant: params.tenant,
      expiresAt,
    });

    return this.sessionsRepository.save(session);
  }

  // Validate a session
  async validateSession(sessionId: string): Promise<UserSession> {
    const session = await this.sessionsRepository.findOne({
      where: { sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (new Date() > session.expiresAt) {
      await this.sessionsRepository.delete({ id: session.id });
      throw new Error('Session expired');
    }

    return session;
  }

  // Revoke all user sessions
  async revokeUserSessions(userId: number): Promise<void> {
    await this.sessionsRepository.delete({ userId });
  }

  // Store PKCE data (code_verifier and code_challenge)
  async storePKCEData(params: {
    institute: string;
    code: string;
    pkce_code_challenge: string;
    pkce_code_verifier: string;
    clientId: string;
    tenant?: string;
    userId: any;
  }): Promise<void> {
    // Store the PKCE data in the session or another storage method
    await this.sessionsRepository.save({
      sessionId: params?.code,
      userId: params?.userId,
      clientId: params?.clientId,
      pkce_code_challenge: params?.pkce_code_challenge,
      institute: params?.institute || "abc",
      pkce_code_verifier: params?.pkce_code_verifier,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Store for 10 minutes or less
    });
  }

  // Fetch PKCE data
  async fetchPKCEData(code: string): Promise<any> {
    const pkceData = await this.sessionsRepository.findOne({
      where: { sessionId: code },
    });

    if (!pkceData) {
      throw new Error('PKCE data not found');
    }

    return pkceData;
  }

  // Clear PKCE data after successful validation
  async clearPKCEData(code: string): Promise<void> {
    await this.sessionsRepository.delete({ sessionId: code });
  }

  // Generate a session ID (for PKCE or normal sessions)
  private generateSessionId(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }
}
