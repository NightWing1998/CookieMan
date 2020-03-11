import { Request, NextFunction, Response } from "express";
import { GraphQLRequestContext } from "apollo-server-types";
import { GraphQLError } from "graphql";

import { verify } from "jsonwebtoken";
import config from "./config";

export const requestLogger = (req: Request, _: Response, next: NextFunction): void => {
	if (req.path === `/api${config.GRAPHQL_ROUTE}`)
		console.log(`# Host: ${req.headers["x-forwarded-host"] || req.hostname}\tRemote Address: ${req.headers["x-forwarded-for"] || req.connection.remoteAddress}\tMethod: ${req.method}\tPath: ${req.path}\tCookies: ${req.signedCookies}`);
	else console.log(`# Host: ${req.headers["x-forwarded-host"] || req.hostname}\tRemote Address: ${req.headers["x-forwarded-for"] || req.connection.remoteAddress}\tMethod: ${req.method}\tPath: ${req.path}\tBody: ${JSON.stringify(req.body)}\tQuery-Params: ${JSON.stringify(req.query)}\tCookies: ${req.signedCookies}`);
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
});

export const tokenExtractor = (req: Request, res: Response, next: NextFunction): void => {
	const authorization: string | undefined = req.get("authorization");
	try {
		if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
			let obj = verify(authorization.substring(7), config.JWT_KEY);
			if (typeof obj !== "object") {
				obj = {}
			}
			req.signedCookies = {
				token: authorization.substring(7),
				isAuthenticated: true,
				...obj
			}
		} else {
			req.signedCookies = {
				isAuthenticated: false
			};
		}
		next();
	} catch (err) {
		res.status(400).json({ ...err, token: authorization?.substring(7) });
	}
}