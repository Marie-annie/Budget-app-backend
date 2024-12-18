import { Controller, Get, Post, Delete, Param, Body, Patch, BadRequestException, Request, UseGuards, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(JwtAuthGuard) // Protect the route with JWT
  @Get('summary')
  async getSummary(@Request() req) {
    const userId = req.user.id; // Extract user ID from validated JWT
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
  
    const userId = req.user.id; 
    return this.transactionsService.getMonthlyTransactions(userId, yearNumber);
  }

  @UseGuards(JwtAuthGuard) // Protect the route with JWT
  @Get('category-usage-percent')
  async getCategoryUsagePercent(@Request() req) {
    const userId = req.user.id; // Extract user ID from validated JWT
    return this.transactionsService.getCategoryUsagePercent(userId);
  }

  @UseGuards(JwtAuthGuard) // Protect the route with JWT
  @Get()
  findAll(@Request() req) {
    const userId = req.user.id; // Extract user ID from validated JWT
    return this.transactionsService.findAll(userId);
  }

  @UseGuards(JwtAuthGuard) // Protect the route with JWT
  @Get(':id')
  findOne(@Request() req, @Param('id') id: number) {
    const userId = req.user.id; // Extract user ID from validated JWT
    return this.transactionsService.findOne(userId, id);
  }

  @UseGuards(JwtAuthGuard) // Protect the route with JWT
  @Post()
  create(@Request() req, @Body() createTransactionDto: CreateTransactionDto) {
    const userId = req.user.id; // Extract user ID from validated JWT
    return this.transactionsService.create({ ...createTransactionDto, userId });
  }

  @UseGuards(JwtAuthGuard) // Protect the route with JWT
  @Patch(':id')
  update(@Request() req, @Param('id') id: number, @Body() updateTransactionDto: UpdateTransactionDto) {
    const userId = req.user.id; // Extract user ID from validated JWT
    return this.transactionsService.update(userId, id, updateTransactionDto);
  }

  @UseGuards(JwtAuthGuard) // Protect the route with JWT
  @Delete(':id')
  remove(@Request() req, @Param('id') id: number) {
    const userId = req.user.id; // Extract user ID from validated JWT
    return this.transactionsService.remove(userId, id);
  }
}