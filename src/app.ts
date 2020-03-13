import express, { Request, Response, NextFunction } from "express";
import { ApolloServer } from 'apollo-server-express';
import depthLimit from 'graphql-depth-limit';
import compression from "compression";

import config from "./utils/config";

import typeDefs from "./graphql/typeDef";
import resolvers from "./graphql/resolver";

import { resolve } from "path";

// import { GraphqlRequestLogger, requestLogger, MongooseErrorHandler, tokenExtractor } from "./utils/middleware";
import { tokenExtractor } from "./utils/middleware";

// console.log('config :', config);

export const server = new ApolloServer({
	typeDefs,
	resolvers,
	validationRules: [depthLimit(7)],
	tracing: true, playground: true, introspection: true,
	// plugins: [GraphqlRequestLogger],
	// formatError: MongooseErrorHandler,
	context: ({ req }) => {
		if (req && req.signedCookies) {
			return req.signedCookies;
		}
	}
});

export const app = express();

app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(tokenExtractor);
// app.use(requestLogger);

server.applyMiddleware({
	app, path: `/api/v2${config.GRAPHQL_ROUTE}`, cors: true, bodyParserConfig: {
		inflate: true,
		strict: true,

	},
});

const barcodePath = resolve(__dirname, "..", "barcodes");

app.use("/barcodes", express.static(barcodePath));

app.get("/api/v2", (req: Request, res: Response, next: NextFunction) => {
	res.status(200).json({ "hello": "world" });
});

export default app;