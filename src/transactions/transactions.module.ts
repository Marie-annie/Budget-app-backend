import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transactions.entity';
import { User } from 'src/users/entities/user.entity';
import { Category } from 'src/categories/entities/categories.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, User, Category])],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
