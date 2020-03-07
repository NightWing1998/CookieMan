import { Request, NextFunction, Response } from "express";
import { GraphQLRequestContext } from "apollo-server-types";
import { GraphQLError } from "graphql";
import config from "./config";

export const requestLogger = (req: Request, _: Response, next: NextFunction): void => {
	if (req.path === `/api${config.GRAPHQL_ROUTE}`)
		console.log(`# Host: ${req.headers["x-forwarded-host"] || req.hostname}\tRemote Address: ${req.headers["x-forwarded-for"] || req.connection.remoteAddress}\tMethod: ${req.method}\tPath: ${req.path}\t`);
	else console.log(`# Host: ${req.headers["x-forwarded-host"] || req.hostname}\tRemote Address: ${req.headers["x-forwarded-for"] || req.connection.remoteAddress}\tMethod: ${req.method}\tPath: ${req.path}\tBody: ${JSON.stringify(req.body)}\tQuery-Params: ${JSON.stringify(req.query)}`);
	next();
}

export const MongooseErrorHandler = (error: GraphQLError): any => {
	if (error.extensions?.code === "INTERNAL_SERVER_ERROR" && error.extensions.exception.name === "ValidationError") {
		return {
			message: error.message,
			path: error.path,
			code: 400
		}
	} else return error;
};

export const GraphqlRequestLogger = (): any => ({
	requestDidStart: (reqContext: GraphQLRequestContext) => {
		// requestDidStart: (reqContext: GraphQLRequestContext) => {
		// console.log(reqContext, reqContext.request.operationName, reqContext.request.variables);
		return {
			willSendResponse: (reqContext: GraphQLRequestContext) => {
				// console.log(reqContext.queryHash, reqContext.request.operationName, reqContext.request.variables, reqContext.response?.data);
				if (reqContext.errors) {
					// message in reqContext.errors.message
					console.log("## Hash: ", reqContext.queryHash, "Operation Name: ", reqContext.request.operationName, "Vairables: ", reqContext.request.variables, "Errors: ", reqContext.errors.map(err => err.message));
				} else if (reqContext.response?.data) {
					console.log("## Hash: ", reqContext.queryHash, "Operation Name: ", reqContext.request.operationName, "Vairables: ", reqContext.request.variables, "Response: ", JSON.stringify(reqContext.response.data));
				}
			}
		}
	}
})