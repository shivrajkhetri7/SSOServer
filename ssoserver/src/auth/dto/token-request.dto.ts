import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class TokenRequestDto {
  @IsString()
  @IsNotEmpty()
  grant_type: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsUrl()
  @IsOptional()
  redirect_uri?: string;

  @IsString()
  @IsOptional()
  client_id?: string;

  @IsString()
  @IsOptional()
  client_secret?: string;

  @IsString()
  @IsOptional()
  refresh_token?: string;

  @IsString()
  @IsOptional()
  scope?: string;

  @IsString()
  @IsOptional()
  nonce?: string;

  @IsOptional()
  @IsString()
  code_verifier?: string;
}