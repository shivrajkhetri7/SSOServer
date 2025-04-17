import { Controller, Get, Post, Query, Body, Res, Req, Render } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/users.service';

@Controller('login')
export class LoginController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @Render('login') // This will render views/login.hbs
  showLogin(@Query() query: any, @Req() req: Request) {
    return { 
      client_id: query.client_id,
      redirect_uri: query.redirect_uri,
      state: query.state,
      error: req.query.error 
    };
  }

  @Post()
  async handleLogin(
    @Body() body: { username: string; password: string },
    @Query() query: { client_id: string; redirect_uri: string; state: string },
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      // 1. Validate user credentials
      const user = await this.usersService.validateCredentials(
        body.username, 
        body.password
      );

      // 2. Store user in session
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email
      };

      // 3. Generate authorization code and redirect
      const redirectUri = await this.authService.handleAuthorizationRequest(
        {
          client_id: query.client_id,
          redirect_uri: query.redirect_uri,
          state: query.state,
          response_type: 'code',
          scope: 'openid profile email'
        },
        req.session.user
      );

      return res.redirect(redirectUri);
    } catch (error) {
      return res.redirect(
        `/login?client_id=${query.client_id}` +
        `&redirect_uri=${encodeURIComponent(query.redirect_uri)}` +
        `&state=${query.state}` +
        `&error=Invalid credentials`
      );
    }
  }
}