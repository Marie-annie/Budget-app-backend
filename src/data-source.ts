import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Category } from './categories/entities/categories.entity';
import { Transaction } from './transactions/entities/transactions.entity';

export const dataSource = new DataSource({
  type: 'oracle', 
  host: 'localhost',
  port: 1521, 
  username: 'SYSTEM',
  password: 'password',
  sid: 'FREE',  
  entities: [User, Category, Transaction],  
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],  
  synchronize: false, 
  logging: true,
});
