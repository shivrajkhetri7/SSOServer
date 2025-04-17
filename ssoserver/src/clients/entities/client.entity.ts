import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('oauth_clients')
export class OAuthClient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  institute: string;

  @Column({ nullable: true })
  tenant: string;

  @Column({ unique: true })
  client_id: string;

  @Column()
  client_secret: string;

  @Column('text', { array: true }) // Proper PostgreSQL array type
  redirect_uris: string[];

  @Column('text', { default: 'openid profile email' })
  scopes: string;

  @Column({ nullable: true })
  name?: string;

  @Column('text', { array: true, nullable: true })
  grant_types?: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}