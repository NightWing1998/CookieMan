import { Request, NextFunction, Response } from "express";
import { GraphQLRequestContext } from "apollo-server-types"

export const requestLogger = (req: Request, _: Response, next: NextFunction): void => {
	console.log(`# Host: ${req.headers["x-forwarded-host"] || req.hostname}\tRemote Address: ${req.headers["x-forwarded-for"] || req.connection.remoteAddress}\tMethod: ${req.method}\tPath: ${req.path}\tBody: ${JSON.stringify(req.body)}\tQuery-Params: ${JSON.stringify(req.query)}`);
	next();
}

export const MongooseErrorHandler = (error: Error | any, request: Request, response: Response, next: NextFunction): any => {
	// console.error("@@@", error);

	if (error.name === "CastError" && error.kind === "ObjectId") {
		return response.status(400).send({
			error: "malformatted id"
		});
	} else if (error.name === "ValidationError") {
		return response.status(400).json({
			error: error._message || error.message
		});
	} else if (error.name === "MongoError") {
		return response.status(500).json({
			error: error._message || error.message
		})
	} else if (error.name === "UnknownError") {
		return response.status(error.statusCode).json({
			error: error._message || error.message
		});
	}

	next(error);
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