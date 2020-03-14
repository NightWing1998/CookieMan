import { GraphQLFieldConfigArgumentMap } from "graphql";

// import deliveryPersonel from "../models/deliveryPersonel";
import OrderModel from "../models/order";
import { MongooseDocument } from "mongoose";

import PriorityQueue from "ts-priority-queue";

// import { ApolloError, PubSub, withFilter } from "apollo-server-express";
import { PubSub, withFilter } from "apollo-server-express";

import { Order } from "../utils/interfaces";

import UserResolver from "./resolvers/User";
import QueryResolver from "./resolvers/Query";
import MutationResolver from "./resolvers/Mutation";
import OrderResolver from "./resolvers/Order";

import { comparator } from "../utils/helper";

import config from "../utils/config";

const pubsub = new PubSub();

const currentLocation = [19, 19];
const pricePerUnit = 20;

const multipleOrders: PriorityQueue<Order>[] = [];

// initialise multipleOrders
(async () => {
	const angleForEachSection = Math.floor(360 / config.SECTIONS);
	const orders: Order[] = (await OrderModel.find({ status: "OrderModeled" }))
		.map((order: MongooseDocument): any => ({
			...order.toJSON(),
			arrivalTime: order.get("arrivalTime")?.getTime()
		}));
	orders
		.forEach(order => {
			let index = order.angle / angleForEachSection;
			if (multipleOrders[index]) {
				multipleOrders[index].queue(order)
			} else {
				multipleOrders[index] = new PriorityQueue<Order>({
					comparator,
					initialValues: [order]
				});
			}
		});
	// console.log(multipleOrders.map(p => p.peek()));
})();

export default {
	Query: {
		...QueryResolver(multipleOrders, pubsub, currentLocation)
	},
	Mutation: {
		...MutationResolver(multipleOrders, pubsub, currentLocation, pricePerUnit)
	},
	Subscription: {
		orderTracking: {
			subscribe: withFilter(
				() => pubsub.asyncIterator(["ORDER_UPDATE"]),
				(payload: any, variables: GraphQLFieldConfigArgumentMap): boolean => {
					const { orderId } = variables;
					// console.log(payload, variables, payload.orderTracking.id === orderId.toString());
					return payload.orderTracking.id === orderId.toString()
				}
			)
		}
	},
	User: {
		...UserResolver()
	},
	Order: {
		...OrderResolver()
	}
};