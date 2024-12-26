import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transactions.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Category } from 'src/categories/entities/categories.entity';
import { User } from 'src/users/entities/user.entity';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, subDays } from 'date-fns';

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

  async findAll(userId: number): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { user: { id: userId } },
      relations: {
        user: true,
        category: true,
      },
    });
  }

  async findByUser(userId: number) {
    return this.transactionRepository.find({
        where: { user: { id: userId } },
        relations: {category: true, user: true}, 
    });
}

async findUserTransactions(userId: number): Promise<Transaction[]> {
  return this.transactionRepository.find({
    where: { user: { id: userId } }, 
    relations: {category: true, user: true},
  });
}

  findOne(userId: number, id: number): Promise<Transaction> {
    return this.transactionRepository.findOne({
      where: { id, user: { id: userId } },
      relations: {
        user: true,
        category: true,
      },
    });
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

  async update(userId: number, id: number, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    await this.transactionRepository.update({ id, user: { id: userId } }, updateTransactionDto);
    return this.findOne(userId, id);
  }

  async getDashboardSummary(userId: number) {
    const [income, expenses, savings] = await Promise.all([
      this.transactionRepository
        .createQueryBuilder('transaction')
        .where('transaction.user.id = :userId', { userId })
        .andWhere('transaction.type = :type', { type: 'income' })
        .select('SUM(transaction.amount)', 'total')
        .getRawOne(),
  
      this.transactionRepository
        .createQueryBuilder('transaction')
        .where('transaction.user.id = :userId', { userId })
        .andWhere('transaction.type = :type', { type: 'expense' })
        .select('SUM(transaction.amount)', 'total')
        .getRawOne(),
  
      this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoin('transaction.category', 'category')
        .where('transaction.user.id = :userId', { userId })
        .andWhere('category.name = :categoryName', { categoryName: 'savings' })
        .select('SUM(transaction.amount)', 'total')
        .getRawOne(),
    ]);
  
    const totalIncome = income?.total || 0;
    const totalExpenses = expenses?.total || 0;
    const totalSavings = savings?.total || 0;
    const totalBalance = totalIncome - totalExpenses;
  
    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      totalBalance,
    };
  }

  async getWeeklyTransactions(userId: number) {
    const startOfWeekDate = subDays(new Date(), 6); // 6 days back from today
    const endOfWeekDate = new Date(); // Today

    const daysOfWeek = eachDayOfInterval({ start: startOfWeekDate, end: endOfWeekDate });

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.user.id = :userId', { userId })
      .andWhere('transaction.createdAt BETWEEN :startOfWeekDate AND :endOfWeekDate', { startOfWeekDate, endOfWeekDate })
      .getMany();

    const dailySummary = daysOfWeek.map(day => {
      const dayTransactions = transactions.filter(t => format(t.createdAt, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
      const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      return {
        date: format(day, 'yyyy-MM-dd'),
        income,
        expenses,
        transactions: dayTransactions,
      };
    });

    return dailySummary;
  }

  async getCategoryUsagePercent(userId: number) {
    const totalAmount = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .where('transaction.user.id = :userId', { userId })
      .getRawOne();
  
    const categories = await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.category', 'category')
      .select('category.name', 'categoryName')
      .addSelect('SUM(transaction.amount)', 'total')
      .where('transaction.user.id = :userId', { userId })
      .groupBy('category.name')
      .getRawMany();
  
    return categories.map(category => ({
      category: category.categoryName,
      percentage: (category.total / totalAmount.total) * 100,
    }));
  }

  async remove(userId: number, id: number): Promise<void> {
    await this.transactionRepository.delete({ id, user: { id: userId } });
  }
}
