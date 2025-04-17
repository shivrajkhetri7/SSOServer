import { Injectable } from '@nestjs/common';
import { TokenService } from './token.service';
import { SessionsService } from '../../sessions/sessions.service';
import { ClientsService } from '../../clients/clients.service';
import { UsersService } from '../../users/users.service';
import { AuthorizationRequestDto } from '../dto/authorization-request.dto';
import { TokenRequestDto } from '../dto/token-request.dto';
import { TokenResponseDto } from '../dto/token-response.dto';
import * as crypto from 'crypto';


@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly sessionsService: SessionsService,
    private readonly clientsService: ClientsService,
    private readonly usersService: UsersService,
  ) {}

  async handleAuthorizationRequest(
    query: any,
    user: any,
  ): Promise<string> {
    const client = await this.clientsService.validateClient(query?.client_id);
    
    // Verify redirect_uri matches client's registered URIs (Optional)
    // if (!client?.redirect_uri?.includes(query?.redirect_uri)) {
    //   throw new Error('Invalid redirect URI');
    // }

    const code = await this.sessionsService.createAuthorizationCode({
      code: this.generateRandomToken(),
      userId: user.id,
      clientId: client?.client?.client_id || "",
      redirectUri: query?.redirect_uri,
      expiresAt: new Date(Date.now() + 60000),
      institute: client?.client?.institute || "",
      tenant: client?.client?.tenant || "",
    });
    // Store the code_challenge and code_verifier in the session for later verification
    let  userId = user.id;
    const { code_challenge, pkce_code_verifier } = query;

    const response = await this.sessionsService.storePKCEData({
      code: code.code,
      userId: userId,
      pkce_code_challenge: code_challenge,
      pkce_code_verifier: pkce_code_verifier,
      clientId: client?.client?.client_id || "",
      institute: client?.client?.institute || "",
      tenant: client?.client?.tenant || "",
    });

    // Build redirect URI with code and state
    const redirectUri = new URL('http://localhost:5174/callback');
    redirectUri.searchParams.set('code', code.code);
    redirectUri.searchParams.set('state', query.state);

    return redirectUri.toString();
  }

  async handleTokenRequest(body: TokenRequestDto): Promise<TokenResponseDto> {
    switch (body.grant_type) {
      case 'authorization_code':
        return this.handleAuthorizationCodeGrant(body);
      case 'refresh_token':
        return this.handleRefreshTokenGrant(body);
      default:
        throw new Error('Unsupported grant type');
    }
  }

  private async handleAuthorizationCodeGrant(
    body: TokenRequestDto,
  ): Promise<TokenResponseDto> {
    if (!body.code || !body.redirect_uri || !body.client_id || !body.code_verifier) {
      throw new Error('Missing required parameters');
    }

    // Validate client credentials
    const client = await this.clientsService.validateClient(
      body.client_id,
      body.client_secret,
    );
    // Fetch authorization code from the session (or a DB)
    const authCode = await this.sessionsService.validateAuthorizationCode(
      body.code,
      body.client_id,
      body.redirect_uri,
    );

    // const storedPKCEData = await this.sessionsService.fetchPKCEData(body.code);
    // if (!storedPKCEData) {
    //   throw new Error('PKCE data not found');
    // }
    
    // const isValidVerifier = this.verifyPKCE(body.code_verifier, storedPKCEData.pkce_code_challenge);
    // if (!isValidVerifier) {
    //   throw new Error('Invalid PKCE code_verifier');
    // }

    // Get the user based on the authorization code
    const user = await this.usersService.findById(authCode.user_id);

    // Generate tokens
    const [accessToken, idToken, refreshToken] = await Promise.all([
      this.tokenService.generateAccessToken(user, client, body.scope || 'openid'),
      this.tokenService.generateIdToken(user, client, body.nonce),
      this.tokenService.generateRefreshToken(user.id, client.clientId),
    ]);

    await this.sessionsService.createUserSession({
      userId: user.id,
      clientId: body?.client_id,
      institute: authCode.institute,
      tenant: authCode.tenant,
    });

    // Clear the PKCE data from the session after successful validation
    await this.sessionsService.clearPKCEData(body.code);

    return {
      access_token: accessToken,
      id_token: idToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      token_type: 'Bearer',
      scope: body.scope || 'openid',
    };
  }

  private verifyPKCE(codeVerifier: string, codeChallenge: string): boolean {
    // The verification algorithm is based on SHA256
    const hashedVerifier = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    return hashedVerifier === codeChallenge;
  }

  private async handleRefreshTokenGrant(
    body: TokenRequestDto,
  ): Promise<any> {
    if (!body.refresh_token || !body.client_id) {
      throw new Error('Missing required parameters');
    }

    // Validate client credentials
    const client = await this.clientsService.validateClient(
      body.client_id,
      body.client_secret,
    );

    // Validate refresh token
    const { sub } = await this.tokenService.validateRefreshToken(
      body.refresh_token,
    );

    // Verify the refresh token belongs to this client
    const payload = await this.tokenService.validateRefreshToken(
      body.refresh_token,
    );
    if (payload.client_id !== client.client_id) {
      throw new Error('Invalid refresh token for this client');
    }

    // Get user
    const user = await this.usersService.findById(parseInt(sub));

    // Generate new tokens
    const [accessToken, idToken] = await Promise.all([
      this.tokenService.generateAccessToken(user, client, body.scope || 'openid'),
      this.tokenService.generateIdToken(user, client),
    ]);

    return {
      access_token: accessToken,
      id_token: idToken,
      expires_in: 3600, // 1 hour
      token_type: 'Bearer',
      scope: body.scope || 'openid',
    };
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const payload = await this.tokenService.validateAccessToken(accessToken);
    const user = await this.usersService.findById(parseInt(payload.sub));

    return {
      sub: user.id,
      name: user.username,
      given_name: '',
      family_name: '',
      email: user.email,
      email_verified: false,
      picture: '',
      updated_at: user.updatedAt ? Math.floor(user.updatedAt.getTime() / 1000) : undefined,
    };
  }

  async logout(idTokenHint?: string): Promise<void> {
    if (idTokenHint) {
      const { sub } = await this.tokenService.validateIdToken(
        idTokenHint,
        'client-id-from-token',
      );
      await this.sessionsService.revokeUserSessions(parseInt(sub));
    }
  }

  private generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
