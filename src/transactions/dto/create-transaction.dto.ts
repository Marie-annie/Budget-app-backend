import { IsEnum, IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsEnum(['income', 'expense'], { message: 'Type must be either "income" or "expense"' })
  type: string;

  @IsNumber()
  @IsPositive({ message: 'Amount must be a positive number' })
  amount: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsNumber()
  userId: number;
}
