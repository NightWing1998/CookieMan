import { GraphQLFieldConfigArgumentMap } from "graphql";

import { Order, token } from "../interfaces";

import { ApolloError, PubSub } from "apollo-server-express";

import { hashSync, compareSync, genSaltSync } from "bcrypt";

import { sign } from "jsonwebtoken";

import Users from "../../models/user";
import order from "../../models/order";

import config from "../../utils/config";
import { MongooseDocument } from "mongoose";

import qrcode from "qrcode";
import md5 from "md5";

import { resolve } from "path";

export const MutationResolver = (multipleOrders: Order[][], pubsub: PubSub, currLocation: number[], pricePerUnit: number) => ({
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
	},
	placeOrder: async (_: void, args: GraphQLFieldConfigArgumentMap, context: any): Promise<Order> => {
		const { id, category, isAuthenticated, email } = context;
		if (!isAuthenticated) {
			throw new ApolloError(`Login required. Please login first`, "FORBIDDEN");
		} else if (category === "deliverypersonel") {
			// esentially an admin or customer can place an order, hence
			throw new ApolloError(`Invalid category {${category}}. Cannot place order`, "FORBIDDEN");
		}

		const customer: MongooseDocument | undefined | null = await Users.findById(id);
		if (customer === null || customer === undefined || customer.get("category") !== category) {
			throw new ApolloError(`Invalid data in token. Please login again`, "INVALID_TOKEN");
		}

		const { lat, long, customerAddress, quantity } = args;
		const distance = Math.sqrt(Math.pow((currLocation[0] - parseFloat(lat.toString())), 2) + Math.pow(currLocation[1] - parseFloat(long.toString()), 2));
		let orderAddress: string = customer.get("defaultAddress") || "";
		if (customerAddress !== null && customerAddress !== undefined) {
			orderAddress = customerAddress.toString();
		}
		const current = Date.now();
		let filename = `${email}_${current}.png`;
		const barcodePath = resolve(__dirname, "..", "..", "..", "barcodes", filename);
		await qrcode.toFile(barcodePath, md5(`${email}_${customerAddress}_${distance}_${quantity}_${current}`));
		const newO = (await order.create({
			customerAddress: orderAddress, distance, quantity,
			price: pricePerUnit * parseInt(quantity.toString()),
			barcodePath: `/barcodes/${filename}`,
			arrivalTime: new Date(current),
			user: id,
			angle: (Math.floor(Math.atan2(parseFloat(lat.toString()) - currLocation[0], parseFloat(long.toString()) - currLocation[1]) * 180 / Math.PI) + 360) % 360
		})).toJSON();
		let o: Order = {
			...newO,
			user: customer.toJSON(),
			arrivalTime: current
		}
		// console.log(o);
		const angleForEachSection = Math.floor(360 / config.SECTIONS);
		let index = o.angle / angleForEachSection;
		if (multipleOrders[index]) {
			multipleOrders[index].push(o)
		} else {
			multipleOrders[index] = [o];
		}
		console.log("@@", multipleOrders);
		return o;
	}
});

export default MutationResolver;