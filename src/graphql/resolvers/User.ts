import OrderModel from "../../models/order";

import { ApolloError } from "apollo-server-express";

const fetchOrders = async (userCategory: string, userId: string, page: number, status?: string[]): Promise<string[]> => {
	if (userCategory === "deliverypersonel") {
		return (await OrderModel.find({
			deliveryPersonel: userId,
			status: {
				$in: status ? status : []
			}
		})
			.skip(page * 10)
			.limit(10)
		)
			.map(order => order.toJSON().id);
	} else {
		return (await OrderModel.find({
			user: userId,
			status: {
				$in: status ? status : []
			}
		})
			.skip(page * 10)
			.limit(10)
		)
			.map(order => order.toJSON().id);
	}
}

export const UserResolver = () => ({
	currentOrders: async (parent: any, args: any, context: any): Promise<string[]> => {
		// console.log("@1", parent, "#1", context, "$1", args, parent.id === context.id);
		let page = parseInt(args.page?.toString()) || 0;
		if (context.category === "admin") {
			return fetchOrders(parent.category, parent.id, page, ["assigned", "ordered"]);
		} else if ((parent && parent.id && context && context.id && parent.id === context.id)) {
			return fetchOrders(context.category, parent.id, page, ["assigned", "ordered"]);
		} else {
			throw new ApolloError("Requested user details does not match with logged in user", `INVALID_USER_ID`);
		}
	},
	history: async (parent: any, args: any, context: any): Promise<string[]> => {
		// console.log("@2", parent, "#2", context, "$2", args, parent.id === context.id);
		let page = parseInt(args.page?.toString()) || 0;
		if (context.category === "admin") {
			return fetchOrders(parent.category, parent.id, page, ["assigned", "ordered", "delivered"]);
		} else if ((parent && parent.id && context && context.id && parent.id === context.id)) {
			return fetchOrders(context.category, parent.id, page, ["assigned", "ordered", "delivered"]);
		} else {
			throw new ApolloError("Requested user details does not match with logged in user", `INVALID_USER_ID`);
		}
	}
})

export default UserResolver;