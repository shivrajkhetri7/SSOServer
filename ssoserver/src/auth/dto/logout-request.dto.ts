import { IsString, IsOptional, IsUrl } from 'class-validator';

export class LogoutRequestDto {
  @IsString()
  @IsOptional()
  id_token_hint?: string;

  @IsUrl()
  @IsOptional()
  post_logout_redirect_uri?: string;
}