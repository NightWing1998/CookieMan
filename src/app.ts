import express, { Request, Response, NextFunction } from "express";
import { ApolloServer } from 'apollo-server-express';
import depthLimit from 'graphql-depth-limit';
import compression from "compression";

import config from "./utils/config";

import typeDefs from "./graphql/typeDef";
import resolvers from "./graphql/resolver";

import { GraphqlRequestLogger, requestLogger } from "./utils/middleware";

// console.log('config :', config);

const server = new ApolloServer({
	typeDefs,
	resolvers,
	validationRules: [depthLimit(7)],
	tracing: true, playground: true, introspection: false,
	plugins: [GraphqlRequestLogger],
});

const app = express();

app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(requestLogger);

server.applyMiddleware({
	app, path: `/api${config.GRAPHQL_ROUTE}`, cors: true, bodyParserConfig: {
		inflate: true,
		strict: true
	}
});

app.get("/api", (req: Request, res: Response, next: NextFunction) => {
	res.status(200).json({ "hello": "world" });
});

export default app;