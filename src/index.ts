import http from "http";
import app, { server } from "./app";
import config from "./utils/config";

import fs from "fs";
import { resolve } from "path";

import { connect } from "mongoose";

const httpServer = http.createServer(app);

server.installSubscriptionHandlers(httpServer);

httpServer.listen(config.PORT, (): void => {
	console.log(`Server started at ${config.PORT}. \nGraphQL path: /api${config.GRAPHQL_ROUTE}. \nSubscription Path: ${server.subscriptionsPath}`);
	const barcodesPath = resolve(__dirname, "..", "barcodes");
	if (!fs.existsSync(barcodesPath)) {
		fs.mkdirSync(barcodesPath);
		console.log("Barcodes directory created!");
	} else {
		console.log("Barcodes directory exists");
	}
	connect(config.MONGODB_URI, {
		useUnifiedTopology: true,
		useCreateIndex: true,
		autoIndex: true,
		useNewUrlParser: true,
		useFindAndModify: false
	}).then((): void => {
		console.log(`Connected to mongodb ${config.MONGODB_URI}`);
	}).catch((err: Error): void => {
		console.error(`Error in connecting to ${config.MONGODB_URI}: \n${err}`);
	})
});