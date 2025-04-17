import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    await this.usersRepository.update({ id }, updates);
    return this.findById(id);
  }

  // In your UsersService
async validateCredentials(username: string, password: string) {
  // 1. Find user by username/email
  const user = await this.usersRepository.findOne({ 
    where: { username } 
  });
  
  if (!user) {
    throw new Error('User not found');
  }

  // const isPasswordValid = await crypto.compare(password, user.password);
  
  // if (!isPasswordValid) {
  //   throw new Error('Invalid password');
  // }

  // 3. Return user without sensitive data
  return {
    id: user.id,
    username: user.username,
    email: user.email
  };
}
}