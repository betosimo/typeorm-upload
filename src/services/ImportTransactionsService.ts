import Transaction from '../models/Transaction';
import { getRepository, getCustomRepository, In } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';

import uploadConfig from '../configs/upload';
import path from 'path';
import fs from 'fs';
import AppError from '../errors/AppError';
import csvParse from 'csv-parse';
import Category from '../models/Category';


// interface Request {
//   // transaction_id: string;
//   // csv_filename: string;
//   file_path: string;
// }
interface CSVTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class ImportTransactionsService {
  public async execute(file_path: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const contactReadStream = fs.createReadStream(file_path);
    const parsers = csvParse({
      from_line: 2,
    });
    const parseCsv = contactReadStream.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCsv.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim()
      );

      if (!title || !type || !value) { return; }
      categories.push(category);
      transactions.push({ title, type, value, category });
    })
    await new Promise(resolve => parseCsv.on('end', resolve));

    const categoryExists = await categoriesRepository.find({
      where: {
        title: In(categories)
      }
    });

    const existentCategoryTitle = categoryExists
      .map(
        (category: Category) => category.title
      );

      const addCategoryTitles = categories
      .filter(category=>!existentCategoryTitle.includes(category))
      .filter((value,index,self)=>self.indexOf(value)===index);

      const newCategories = categoriesRepository.create(
        addCategoryTitles.map(title=>({
          title
        }))
      );

      await categoriesRepository.save(newCategories);

      const finalCategories = [...newCategories, ...categoryExists];

      const createdTransactions = transactionsRepository.create(
        transactions.map(transaction=>({
          title: transaction.title,
          type: transaction.type,
          value: transaction.value,
          category: finalCategories.find(
            category=>category.title===transaction.category
          ),

        }))
      );
      await transactionsRepository.save(createdTransactions)
      await fs.promises.unlink(file_path);
      return createdTransactions;
    console.log(categories);
    console.log(transactions);

    // const transactionRepository = getRepository(Transaction);
    // const transaction = await transactionRepository.findOne(transaction_id);

    // if (!transaction) {
    //   throw new AppError('only authenticated transaction can update csv', 401)

    // }
    // if (transaction.csv) {
    //   const transactionCsvFilePath = path.join(uploadConfig.directory, transaction.csv);
    //   const transactionCsvFileExists = await fs.promises.stat(transactionCsvFilePath);
    //   if (transactionCsvFileExists) {
    //     await fs.promises.unlink(transactionCsvFilePath);
    //   }
    // }

    // transaction.csv = csv_filename;
    // transactionRepository.save(transaction);
    // return transaction;
  }
}

export default ImportTransactionsService;
