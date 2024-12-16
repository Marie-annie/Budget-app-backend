import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transactions.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  findAll(): Promise<Transaction[]> {
    return this.transactionRepository.find();
  }

  findOne(id: number): Promise<Transaction> {
    return this.transactionRepository.findOneBy({ id });
  }

  create(transaction: Partial<Transaction>): Promise<Transaction> {
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
      .andWhere('transaction.userId = :userId', { userId }) // Ensure transactions belong to the user
      .groupBy("month, transaction.type")
      .orderBy("month", "ASC")
      .getRawMany();
  
    // Initialize all months with income and expense as 0
    const monthlyData = Array.from({ length: 12 }, (_, index) => {
      const month = new Date(year, index).toLocaleString('default', { month: 'short' }); // Convert month number to short name
      return { month, income: 0, expense: 0 };
    });
  
    result.forEach((row) => {
      const { month, type, totalAmount } = row;
  
      // Skip rows with missing or invalid data
      if (!month || !type || totalAmount == null) {
        return;
      }
  
      // Extract the month index (e.g., "2024-01" -> 0 for January)
      const monthIndex = parseInt(month.split('-')[1], 10) - 1;
  
      // Safely update the correct month
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
      .select('transaction.category', 'category')
      .addSelect('SUM(transaction.amount)', 'total')
      .where('transaction.userId = :userId', { userId })
      .groupBy('transaction.category')
      .getRawMany();

    return categories.map(category => ({
      category: category.category,
      percent: (category.total / totalAmount.total) * 100,
    }));
  }

  async remove(id: number): Promise<void> {
    await this.transactionRepository.delete(id);
  }
}
