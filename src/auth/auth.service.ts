import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service'; 
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { access } from 'fs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService, 
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
const {username, email, passwordHash, role} = createUserDto;
    const password = await bcrypt.hash(passwordHash, 10);
    return this.usersService.create({
      email,
      passwordHash: password,
      role,
      username,
    });
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: User) {
    const payload = { userId: user.id, username: user.username };
    const  token = this.jwtService.sign(payload);
    return {
      access_token: token,
      role: user.role,
    }
 }
}
