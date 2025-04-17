import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_sessions')
export class UserSession {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, name: 'session_id' })
    sessionId: string;

    @Column()
    institute: string;

    @Column({ nullable: true })
    tenant: string;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ name: 'client_id' })
    clientId: string;

    @Column({ name: 'expires_at' })
    expiresAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}