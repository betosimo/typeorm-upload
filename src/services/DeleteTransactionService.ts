import AppError from '../errors/AppError';
import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute( id : string): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

const idTransaction = await transactionsRepository.findOne(id);
if (!idTransaction) {
  throw new AppError('transaction not found',401)

}
await transactionsRepository.remove(idTransaction);



  }
}

export default DeleteTransactionService;
