import { GraphQLFieldConfigArgumentMap } from "graphql";

import PriorityQueue from "ts-priority-queue";
import { Order, token } from "../interfaces";

import { ApolloError, PubSub } from "apollo-server-express";

import { hashSync, compareSync, genSaltSync } from "bcrypt";

import { sign } from "jsonwebtoken";

import Users from "../../models/user";

import config from "../../utils/config";

export const MutationResolver = (OrderQueue: PriorityQueue<Order>, pubsub: PubSub) => ({
	addUser: async (_: void, args: GraphQLFieldConfigArgumentMap, context: any): Promise<token> => {
		const { name, number, email, address, category, password } = args;
		if (context.isAuthenticated) {
			throw new ApolloError(`User already logged in. Token - {${context.token}}`, "FORBIDDEN");
		}
		if (password.toString().length < 10) {
			throw new ApolloError(`Length of argument password {${password}} should be greater then 10`);
		}
		if (category.toString().toLowerCase() === "admin") {
			throw new ApolloError("Cannot define admin users", "FORBIDDEN");
		} else if (category.toString().toLowerCase() === "customer" && address === undefined) {
			throw new ApolloError(`Field address required for category ${category}`, "INVALID_ARGUMENTS");
		}
		const hashedPassword = hashSync(password, genSaltSync(config.SALT_ROUNDS));
		const newPersonel = (await Users.create({ name, number, email, defaultAddress: address, category: category.toString().toLowerCase(), password: hashedPassword })).toJSON();
		// console.log("#", newPersonel);
		const token = sign({
			email: newPersonel.email,
			id: newPersonel.id,
			category: category
		}, config.JWT_KEY, {
			expiresIn: 24 * 60 * 60 * 1000,
		});
		return {
			token
		};
	},
	login: async (_: void, args: GraphQLFieldConfigArgumentMap, context: any): Promise<token> => {
		if (context.isAuthenticated) {
			throw new ApolloError(`User already logged in. Token - {${context.token}}`, "FORBIDDEN");
		}
		const { email, password } = args;
		const userFromEmail = (await Users.findOne({ email }));
		if (userFromEmail === null || userFromEmail === undefined) {
			throw new ApolloError("Email ID or password inavlid.", "INVALID_ARGUMENTS");
		}
		if (compareSync(password, userFromEmail.get("password"))) {
			return {
				token: sign({
					email: userFromEmail.get("email"),
					id: userFromEmail._id.toString(),
					category: userFromEmail.get("category")
				}, config.JWT_KEY)
			}
		} else {
			throw new ApolloError("Email ID or password inavlid.", "INVALID_ARGUMENTS");
		}
	}
});

export default MutationResolver;