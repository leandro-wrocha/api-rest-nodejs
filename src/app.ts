import fastify from "fastify";
import { transactionRoutes } from "./routes/transactions";
import cookie from '@fastify/cookie';

const app = fastify();

app.register(cookie);

app.register(transactionRoutes, {
  prefix: "transactions"
});

export { app };
