import { Controller, Get, Post, Delete, Param, Body, Patch, BadRequestException, Request, UseGuards, Query} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transactions.entity';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(JwtAuthGuard) // Protect the route with JWT
  @Get('summary')
  async getSummary(@Request() req) {
    const userId = req.user.userId; // Extract user ID from validated JWT
    return this.transactionsService.getDashboardSummary(userId);
  }

  @UseGuards(JwtAuthGuard) // Protect the route with JWT
  @Get('yearly-income-expense')
  async getMonthlyTransactions(@Request() req, @Query('year') year?: string) {
    // Default to current year if no year is provided
    const yearNumber = year ? parseInt(year, 10) : new Date().getFullYear();
  
    // Validate year if provided
    if (year && isNaN(yearNumber)) {
      throw new BadRequestException('Invalid year parameter'); // Throw HTTP exception for invalid year
    }
  
    const userId = req.user.userId; 
    return this.transactionsService.getMonthlyTransactions(userId, yearNumber);
  }
  

  @UseGuards(JwtAuthGuard) // Protect the route with JWT
  @Get('category-usage-percent')
  async getCategoryUsagePercent(@Request() req) {
    const userId = req.user.userId; // Extract user ID from validated JWT
    return this.transactionsService.getCategoryUsagePercent(userId);
  }

  @Get()
  findAll(): Promise<Transaction[]> {
    return this.transactionsService.findAll();
  }

  @Post()
  create(@Body() transaction: CreateTransactionDto): Promise<Transaction> {
    return this.transactionsService.create(transaction);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Transaction> {
    console.log('Received ID:', id); // Log the received ID
    id = id.trim(); // Remove surrounding spaces/newlines
    if (!id || isNaN(Number(id))) {
      throw new BadRequestException('Invalid transaction ID format');
    }
    return this.transactionsService.findOne(Number(id)); // Pass the cleaned number to the service
  }
  
  @Patch(':id')
  update(@Param('id') id: string, @Body() transaction: Partial<Transaction>): Promise<Transaction> {
    console.log('Received ID:', id); // Log the received ID
    id = id.trim(); // Remove surrounding spaces/newlines
    if (!id || isNaN(Number(id))) {
      throw new BadRequestException('Invalid transaction ID format');
    }
    return this.transactionsService.update(Number(id), transaction);
  }
  
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    console.log('Received ID:', id); // Log the received ID
    id = id.trim(); // Remove surrounding spaces/newlines
    if (!id || isNaN(Number(id))) {
      throw new BadRequestException('Invalid transaction ID format');
    }
    return this.transactionsService.remove(Number(id));
  }
  
}
// Removed the local declaration of UseGuards to avoid conflict with the imported UseGuards

