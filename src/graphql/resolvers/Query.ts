// import { GraphQLFieldConfigArgumentMap } from "graphql";

import { User, Order } from "../interfaces";

import { ApolloError, PubSub } from "apollo-server-express";

// import { MongooseDocument } from "mongoose";

import Users from "../../models/user";
// import order from "../../models/order";

import PriorityQueue from "ts-priority-queue";

export const QueryResolver = (OrdersQueue: PriorityQueue<Order>, pubsub: PubSub) => ({
	// hello: (_: void, args: void, context: any): string => {
	hello: (): string => {
		// console.log("context: ", context);
		return "world"
	},
	getUsers: async (_: void, args: any, context: any): Promise<User[] | []> => {
		const { id, category, email, isAuthenticated } = context;
		if (!isAuthenticated) {
			throw new ApolloError("Login token required for fetching user data", "FORBIDDEN");
		}
		const u = (await Users.findById(id));
		if (u === null || u === undefined) {
			throw new ApolloError("Invalid data in token", "FORBIDDEN");
		}
		if (u.get("category") === category && u.get("email") === email) {
			// TOKEN data and db data match go ahead and complete requests
			if (category === "admin") {
				let { page } = args;
				if (page === undefined) {
					page = 0
				} else if (typeof page !== "number") {
					page = parseInt(page.toString() || '0');
				}
				if (args.category) {
					return (await Users.find({ category }).skip(10 * page).limit(10)).map(doc => doc.toJSON());
				} else
					return (await Users.find({}).skip(10 * page).limit(10)).map(doc => doc.toJSON());
			} else {
				return [u.toJSON()];
			}
		} else {
			throw new ApolloError("Invalid data in token", "FORBIDDEN");
		}
	},
	// getOrders: async (_: void, args: GraphQLFieldConfigArgumentMap): Promise<any> => {
	// 	const { id } = args;
	// 	if (id === undefined) {
	// 		const os = (await order.find({}));
	// 		return os.map(async (og: MongooseDocument): Promise<Order> => {
	// 			const o = (await og.populate("deliveryPersonel").execPopulate()).toJSON();
	// 			return ({
	// 				...o,
	// 				arrivalTime: o.arrivalTime.getTime()
	// 			})
	// 		})
	// 	} else {
	// 		const og = (await order.findById(id).populate("deliveryPersonel"));
	// 		if (og === null) {
	// 			throw new ApolloError(`${id} order does not exist.`, "INVALID_ORDER_ID");
	// 		} else {
	// 			const o = og.toJSON();
	// 			// console.log(o);
	// 			return [{
	// 				...o,
	// 				arrivalTime: o.arrivalTime.getTime()
	// 			}];
	// 		}
	// 	}
	// },
	// acceptOrderForDelivery: async (_: void, args: GraphQLFieldConfigArgumentMap): Promise<Order | null> => {
	// 	if (OrdersQueue.length === 0) {
	// 		return null;
	// 	} else {
	// 		const { deliveryPersonelId } = args;
	// 		const dP = await Users.findById(deliveryPersonelId.toString());
	// 		if (dP === null) {
	// 			throw new ApolloError(`delivery personel with id - ${deliveryPersonelId} does not exist. Please check the deliveryPersonelId`, "INVALID_DELIVERY_PERSONEL_ID");
	// 		} else if (dP.toJSON().currentOrder !== undefined && dP.toJSON().currentOrder !== null) {
	// 			throw new ApolloError(`delivery personel with id - ${deliveryPersonelId} is already assigned order - ${dP.toJSON().currentOrder}. Please complete that first`, "DELIVERY_PERSONAL_BUSY");
	// 		}
	// 		const orderFromQueue = OrdersQueue.dequeue();
	// 		const oldOrder = await order.findById(orderFromQueue.id);
	// 		if (oldOrder === null || oldOrder.toJSON().status !== "ordered") {
	// 			throw new ApolloError(`Server has invalid cache. Please report this issue.`, "INTERNAL_SERVER_ERROR");
	// 		}
	// 		const oJ = oldOrder.toJSON();
	// 		const updatedOrder: Order = {
	// 			...oJ,
	// 			arrivalTime: oJ.arrivalTime.getTime(),
	// 			deliveryPersonel: dP.toJSON(),
	// 			status: "assigned",
	// 		};
	// 		const newStatusOfDP = {
	// 			...dP.toJSON(),
	// 			history: [...dP.toJSON().history].concat(updatedOrder.id),
	// 			currentOrder: updatedOrder.id
	// 		};
	// 		await dP.updateOne(newStatusOfDP);
	// 		await oldOrder.updateOne({
	// 			...updatedOrder,
	// 			deliveryPersonel: dP._id,
	// 			status: "assigned",
	// 		});
	// 		pubsub.publish("ORDER_UPDATE", {
	// 			orderTracking: updatedOrder
	// 		});
	// 		return updatedOrder;
	// 	}
	// }
});

export default QueryResolver;