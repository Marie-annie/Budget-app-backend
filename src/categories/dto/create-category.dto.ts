import { IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'Category name must be a string' })
  name: string;

  @IsString({ message: 'Category type must be a string' })
  type: string;
}
