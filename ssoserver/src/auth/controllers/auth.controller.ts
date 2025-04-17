import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  Req,
  HttpStatus,
  Render,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthorizationRequestDto } from '../dto/authorization-request.dto';
import { TokenRequestDto } from '../dto/token-request.dto';
import { LogoutRequestDto } from '../dto/logout-request.dto';
import { TokenResponseDto } from '../dto/token-response.dto';
import { ClientsService } from 'src/clients/clients.service';
import { UsersService } from 'src/users/users.service';

@Controller('oauth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly clientService: ClientsService,
    private readonly usersService: UsersService,
  ) { }

  @Get('authorize')
  async authorize(
    @Query() query: AuthorizationRequestDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      await this.clientService.validateClient(query.client_id, query.redirect_uri);

      if (!req.session?.user) {
        req.session.authorizationRequest = {
          ...query,
          code_challenge: query.code_challenge, 
          code_challenge_method: query.code_challenge_method,
          state: query.state,
          redirect_uri: query.redirect_uri,
          client_id: query.client_id,
        };
        return res.redirect(
          `/login?client_id=${query.client_id}` +
          `&redirect_uri=${encodeURIComponent(query.redirect_uri)}` +
          `&state=${query.state}`
        );
      }

      // If authenticated, generate authorization code
      const redirectUri = await this.authService.handleAuthorizationRequest(
        query,
        req.session.user,
      );
      return res.redirect(redirectUri);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: 'invalid_request',
        error_description: error.message,
      });
    }
  }

  @Get('login')
  @Render('login')
  showLogin(@Query() query: any, @Req() req: Request) {
    return {
      client_id: query.client_id,
      redirect_uri: query.redirect_uri,
      state: query.state,
      error: req.query.error
    };
  }

  @Post('login')
  async handleSignIn(
    @Body() body: { username: string; password: string },
    @Query() query: { client_id: string; redirect_uri: string; state: string },
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    try {
      console.log("Login request body:", body);

      const user = await this.usersService.validateCredentials(
        body.username,
        body.password
      );

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email
      };

      // Generate redirect URL (but don't redirect)
      const redirectUri = await this.authService.handleAuthorizationRequest(
        {
          client_id: query?.client_id,
          redirect_uri: query?.redirect_uri,
          state: query?.state,
          response_type: 'code',
          scope: 'openid profile email'
        },
        req.session.user
      );

      if (typeof req.query.pkce_verifier === 'string') {
        req.session.pkce_verifier = req.query.pkce_verifier;
      } else {
        req.session.pkce_verifier = ''; // Handle if it's not a string
      }

      return res.redirect(redirectUri);
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message || 'Invalid credentials',
        errorDetails: {
          client_id: query.client_id,
          redirect_uri: query.redirect_uri,
          state: query.state
        }
      };
    }
  }

  @Post('token')
  async token(@Body() body: TokenRequestDto, @Req() req: Request): Promise<TokenResponseDto> {
    try {
      const { code, code_verifier } = body;

      // Check for PKCE code_verifier in session
      // const sessionCodeVerifier = req.session.pkce_verifier;
      // if (!sessionCodeVerifier || sessionCodeVerifier !== code_verifier) {
      //   throw new Error('Invalid code_verifier');
      // }

      // Clear the session code_verifier after successful validation
      req.session.pkce_verifier = null;

      // Proceed with token exchange
      return await this.authService.handleTokenRequest(body);
    } catch (error) {
      throw {
        error: 'invalid_request',
        error_description: error.message,
      };
    }
  }

  @Get('userinfo')
  async userInfo(@Req() req: Request) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        throw new Error('Missing authorization header');
      }

      const token = authHeader.split(' ')[1];
      return await this.authService.getUserInfo(token);
    } catch (error) {
      throw {
        error: 'invalid_token',
        error_description: error.message,
      };
    }
  }

  @Post('logout')
  async logout(
    @Body() body: LogoutRequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      await this.authService.logout(body.id_token_hint);
  
      // ✅ Destroy session only — no redirect
      req.session.destroy(() => null);
  
      // ✅ Just send success response
      return res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: 'logout_failed',
        error_description: error.message,
      });
    }
  }
  

  @Get('check-session')
  async checkSession(@Req() req: Request) {
    try {
      // Check if user session exists
      const isAuthenticated = !!req.session?.user;

      console.log('isAuthenticated',isAuthenticated)
      return {
        isAuthenticated,
        user: isAuthenticated ? req.session.user : null
      };
    } catch (error) {
      throw {
        error: 'session_check_failed',
        error_description: error.message,
      };
    }
  }

  // TODO : Testing Route
  @Get('')
  async Test() {
    try {
      return { status: "success" }
    } catch (error) {
      return { status: "failed" }
    }
  }
}
