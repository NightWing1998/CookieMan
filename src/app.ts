import express, { Request, Response, NextFunction } from "express";
import { ApolloServer } from 'apollo-server-express';
import depthLimit from 'graphql-depth-limit';
import compression from "compression";

import config from "./utils/config";

import typeDefs from "./graphql/typeDef";
import resolvers from "./graphql/resolver";

// console.log('config :', config);

const server = new ApolloServer({ typeDefs, resolvers, validationRules: [depthLimit(7)] });

const app = express();

app.use(compression());

server.applyMiddleware({ app, path: `/api${config.GRAPHQL_ROUTE}` });

app.get("/api", (req: Request, res: Response, next: NextFunction) => {
	res.status(200).json({ "hello": "world" });
});

export default app;