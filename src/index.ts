import http from "http";
import app from "./app";
import config from "./utils/config";

import { connect } from "mongoose";

http.createServer(app).listen(config.PORT, (): void => {
	console.log(`Server started at ${config.PORT}. \nGraphQL path: /api${config.GRAPHQL_ROUTE}`);
	connect(config.MONGODB_URI, {
		useUnifiedTopology: true,
		useCreateIndex: true,
		autoIndex: true,
		useNewUrlParser: true
	}).then((): void => {
		console.log(`Connected to mongodb ${config.MONGODB_URI}`);
	}).catch((err: Error): void => {
		console.error(`Error in connecting to ${config.MONGODB_URI}: \n${err}`);
	})
});