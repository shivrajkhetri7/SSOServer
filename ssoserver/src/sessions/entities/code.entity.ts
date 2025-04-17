import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('oauth_codes')
export class OAuthCode {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    code: string;

    @Column()
    institute: string;

    @Column({ nullable: true })
    tenant: string;

    @Column()
    user_id: number;

    @Column()
    client_id: string;

    @Column('text')
    redirect_uri: string;

    @Column()
    expires_at: Date;

    @CreateDateColumn()
    created_at: Date;
}