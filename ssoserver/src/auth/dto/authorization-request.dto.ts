import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class AuthorizationRequestDto {
  @IsString()
  @IsNotEmpty()
  response_type: string;

  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsUrl()
  @IsNotEmpty()
  redirect_uri: string;

  @IsString()
  scope: string;

  @IsString()
  state: string;

  @IsString()
  nonce?: string;
  code_challenge_method?: any;
  code_challenge?: any;
}