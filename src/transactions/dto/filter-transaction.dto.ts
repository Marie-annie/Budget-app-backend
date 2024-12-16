import { IsOptional, IsEnum } from 'class-validator';

export class FilterTransactionDto {
  @IsOptional()
  @IsEnum(['income', 'expense'], { message: 'Type must be either "income" or "expense"' })
  type?: string;

  @IsOptional()
  userId?: number;

  @IsOptional()
  categoryId?: number;
}
