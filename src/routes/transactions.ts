import { FastifyInstance } from "fastify";
import { z } from 'zod';
import { knex } from "../database";
import crypto from 'node:crypto';
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

// Cookies <--> Formas da gente manter o contexto entre requisições
// unitários: unidade da sua aplicação
// integração: comunicação entre duas ou mais unidades
// e2e - ponta a ponta: simulam um usuário operando na nossa aplicação
// front-end: abre a página de login, digite o texto diego@rocketseat.com.br no campo ID email, clique no botão LOGIN
// back-end: chamadas HTTP, websockets

// Pirâmide de testes: E2E (não dependem de nenhuma tecnologia, não dependem de arquitetura)
// 2000 testes -> Testes E2E => 16min

export async function transactionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request, reply) => {
    console.log(`[${request.method}] ${request.url}`);
  });

  app.get("/", { preHandler: [checkSessionIdExists] } , async (request, reply) => {
    const { sessionId } = request.cookies;

    const transactions = await knex('transactions').where('session_id', sessionId).select();

    return {
      transactions
    }
  });

  app.get("/:id", { preHandler: [checkSessionIdExists] } ,async (request, reply) => {
    const { sessionId } = request.cookies;

    const getTransactionsParamsSchema = z.object({
      id: z.string().uuid()
    });

    const { id } = getTransactionsParamsSchema.parse(request.params);

    const transaction = await knex('transactions').where('id', id).where('session_id', sessionId).first();

    return {
      transaction
    }
  });

  app.get('/summary', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies;

    const summary = await knex('transactions').sum('amount', { as: 'amount' }).where('session_id', sessionId).first();

    return { 
      summary
    };
  });

  app.post("/", async (request, reply) => {
    const createTransctionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit'])
    });

    const { title, amount, type } = createTransctionBodySchema.parse(request.body);

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = crypto.randomUUID();

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }

    await knex('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId
    });

    return reply.status(201).send();
  });
}
