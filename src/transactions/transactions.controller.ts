import { Controller, Get, Post, Delete, Param, Body, Patch, Request, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('summary')
  async getDashboardSummary(@Request() req) {
    const userId = req.user.id;
    return this.transactionsService.getDashboardSummary(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('weekly-income-expense')
  async getWeeklyTransactions(@Request() req) {
    const userId = req.user.id;
    return this.transactionsService.getWeeklyTransactions(userId);
  }  

  @UseGuards(JwtAuthGuard)
  @Get('category-usage-percent')
  async getCategoryUsagePercent(@Request() req) {
    const userId = req.user.id;
    return this.transactionsService.getCategoryUsagePercent(userId);
  }

  // @UseGuards(JwtAuthGuard)
  // @Get()
  // async findAll(@Request() req) {
  //   const userId = req.user.id;
  //   return this.transactionsService.findAll(userId);
  // }

  @UseGuards(JwtAuthGuard) // Protect the route with JWT
  @Get()
  async getUserTransactions(@Request() req) {
    const userId = req.user.userId; // Extract user ID from the token
    return this.transactionsService.findByUser(userId); // Filter transactions by user ID
  }


  @UseGuards(JwtAuthGuard) // Ensures JWT validation
  @Get(':userId')
  async findUserTransactions(@Param('userId') userId: number, @Request() req): Promise<any> {
    return this.transactionsService.findUserTransactions(userId);
  }  

  @Post()
  @UseGuards(JwtAuthGuard)
  createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
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