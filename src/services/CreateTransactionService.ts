import { getCustomRepository, getRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';



interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {



  public async execute({ title, value, type, category }:
    Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category,
      }
    });
    if (!transactionCategory) {
      transactionCategory =  categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(transactionCategory);
    }

    if (!["income", "outcome"].includes(type)) {
      throw new AppError("type invalid");
    }

    const { total } = await transactionsRepository.getBalance();
    if (type === 'outcome' && total < value) {
      throw new AppError("you dont have enough balance");


    }


    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category:transactionCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;