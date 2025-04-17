export class CreateClientDto {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  name?: string;
  grant_types?: string[];
  scopes?: string;
  institute?: string;
  tenant?: string;
}