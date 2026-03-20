import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit(): Promise<void> {
    const admin = await this.findByUsername('admin');
    if (!admin) {
      const hash = await bcrypt.hash('admin123', 10);
      await this.userRepository.save(
        this.userRepository.create({ username: 'admin', password: hash }),
      );
      this.logger.log('Admin seed criado (admin / admin123)');
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }
}
