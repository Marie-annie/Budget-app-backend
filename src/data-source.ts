import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Category } from './categories/entities/categories.entity';
import { Transaction } from './transactions/entities/transactions.entity';

export const dataSource = new DataSource({
  type: 'oracle',  // Specify Oracle as the database type
  host: 'localhost',
  port: 1521,  // Default Oracle port
  username: 'SYSTEM',
  password: 'password',
  sid: 'FREE',  // Oracle SID or Service Name
  entities: [User, Category, Transaction],  // Your entity classes
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],  // Path to migrations
  synchronize: true,  // Set to false to avoid auto-sync in production
  logging: true,
});
