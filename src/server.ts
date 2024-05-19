/**
 * Eslint => Ecmascript Lint
 */

import fastify from "fastify";
import { knex } from "./database";
import { env } from "./env";

const app = fastify();

app.get("/hello", async () => {
  const transaction = await knex("transacitons").insert({
    id: crypto.randomUUID(),
    title: "Transação de teste",
    amount: "./src"
  });
});

app.listen({ port: env.PORT }).then(() => {
  console.log("HTTP Server Running!");
});
