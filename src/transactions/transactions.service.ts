import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transactions.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Category } from 'src/categories/entities/categories.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  findAll(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      relations:{
        user:true,
        category:true,
      }
    });
  }

  findOne(id: number): Promise<Transaction> {
    return this.transactionRepository.findOneBy({ id });
  }

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const { userId, categoryId, ...transactionData } = createTransactionDto;

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    let category = null;
    if (categoryId) {
      category = await this.categoryRepository.findOneBy({ id: categoryId });
      if (!category) {
        throw new NotFoundException(`Category with ID ${categoryId} not found`);
      }
    }

    const transaction = this.transactionRepository.create({
      ...transactionData,
      user,
      category,
    });

    return this.transactionRepository.save(transaction);
  }

  async update(id: number, transaction: Partial<Transaction>): Promise<Transaction> {
    await this.transactionRepository.update(id, transaction);
    return this.transactionRepository.findOneBy({ id });
  }

  async getDashboardSummary(userId: number) {
    const income = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.type = :type', { type: 'income' })
      .select('SUM(transaction.amount)', 'total')
      .getRawOne();

    const expenses = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.type = :type', { type: 'expense' })
      .select('SUM(transaction.amount)', 'total')
      .getRawOne();

    return {
      income: income.total || 0,
      expenses: expenses.total || 0,
      savings: (income.total || 0) - (expenses.total || 0),
    };
  }

  async getMonthlyTransactions(userId: number, year: number) {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        "TO_CHAR(transaction.createdAt, 'YYYY-MM') AS month",
        'transaction.type',
        'SUM(transaction.amount) AS totalAmount',
      ])
      .where("EXTRACT(YEAR FROM transaction.createdAt) = :year", { year })
      .andWhere('transaction.userId = :userId', { userId }) 
      .groupBy("month, transaction.type")
      .orderBy("month", "ASC")
      .getRawMany();
  
   
    const monthlyData = Array.from({ length: 12 }, (_, index) => {
      const month = new Date(year, index).toLocaleString('default', { month: 'short' });
      return { month, income: 0, expense: 0 };
    });
  
    result.forEach((row) => {
      const { month, type, totalAmount } = row;
  
      if (!month || !type || totalAmount == null) {
        return;
      }
  
      const monthIndex = parseInt(month.split('-')[1], 10) - 1;
  
      if (type.toLowerCase() === 'income') {
        monthlyData[monthIndex].income = parseFloat(totalAmount);
      } else if (type.toLowerCase() === 'expense') {
        monthlyData[monthIndex].expense = parseFloat(totalAmount);
      }
    });
  
    return monthlyData;
  }  

  async getCategoryUsagePercent(userId: number) {
    const totalAmount = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .where('transaction.userId = :userId', { userId })
      .getRawOne();

    const categories = await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.category', 'category')
      .select('category.name', 'categoryName')
      .addSelect('SUM(transaction.amount)', 'total')
      .where('transaction.userId = :userId', { userId })
      .groupBy('category.name')
      .getRawMany();

    return categories.map(category => ({
      category: category.categoryName,
      percentage: (category.total / totalAmount.total) * 100,
    }));
  }

  async remove(id: number): Promise<void> {
    await this.transactionRepository.delete(id);
  }
}
