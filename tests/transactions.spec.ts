import { expect, test, it, beforeAll, afterAll, describe, beforeEach } from 'vitest';
import request from 'supertest';
import { execSync } from 'node:child_process';

import { app } from '../src/app';

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready();
  });
  
  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync('yarn knex migrate:rollback --all');
    execSync('yarn knex migrate:latest');
  });
  
  // it or test
  // it('should be able to create a new transaction')
  test('user can create a new transaction', async () => {
    // fazer a chamada HTTP p/ criar uma nova transação
    await request(app.server).post('/transactions').send({
      title: 'New Transaction',
      amount: 5000,
      type: 'credit'
    }).expect(201);
  });

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server).post('/transactions').send({
      title: 'New Transaction',
      amount: 5000,
      type: 'credit'
    }).expect(201);

    const cookies = createTransactionResponse.get('Set-Cookie');

    if (!cookies) {
      expect(cookies).not.toBeUndefined();
    } else {
      const listTransactionsResponse = await request(app.server).get('/transactions').set('Cookie', cookies).expect(200);
      
      expect(listTransactionsResponse.body.transactions).toEqual([
        expect.objectContaining({
          title: 'New Transaction',
          amount: 5000,
        })
      ]);
    }

  });

  it('should be able to get a specific transaction', async () => {
    const createTransactionResponse = await request(app.server).post('/transactions').send({
      title: 'New Transaction',
      amount: 5000,
      type: 'credit'
    }).expect(201);

    const cookies = createTransactionResponse.get('Set-Cookie');

    if (!cookies) {
      expect(cookies).not.toBeUndefined();
    } else {
      const listTransactionsResponse = await request(app.server).get('/transactions').set('Cookie', cookies).expect(200);

      const transactionId = listTransactionsResponse.body.transactions[0].id;

      const getTransactionResponse = await request(app.server)
        .get(`/transactions/${transactionId}`)
        .set('Cookie', cookies)
        .expect(200)
      
      expect(getTransactionResponse.body.transaction).toEqual(
        expect.objectContaining({
          title: 'New Transaction',
          amount: 5000,
        })
      );
    }

  });

  it('should be able to get the summary', async () => {
    const createTransactionResponse = await request(app.server).post('/transactions').send({
      title: 'New Transaction',
      amount: 5000,
      type: 'credit'
    }).expect(201);

    const cookies = createTransactionResponse.get('Set-Cookie');

    if (!cookies) {
      expect(cookies).not.toBeUndefined();
    } else {
      await request(app.server).post('/transactions')
        .set('Cookie', cookies)
        .send({
          title: 'New Transaction',
          amount: 200,
          type: 'debit'
        });

      const summaryResponse = await request(app.server).get('/transactions/summary').set('Cookie', cookies).expect(200);
      
      expect(summaryResponse.body.summary).toEqual({ amount: 4800 });
    }

  });
});

