import { IsString, IsEmail, MinLength, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  passwordHash: string;

  @IsEnum(['user', 'admin'], {message: 'Role must be either "user" or "admin"'})
  role: string;
}
