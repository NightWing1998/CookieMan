import { GraphQLFieldConfigArgumentMap } from "graphql";

// import deliveryPersonel from "../models/deliveryPersonel";
import order from "../models/order";
import { MongooseDocument } from "mongoose";

import PriorityQueue from "ts-priority-queue";

// import { ApolloError, PubSub, withFilter } from "apollo-server-express";
import { PubSub, withFilter } from "apollo-server-express";

import { Order } from "../utils/interfaces";

import UserResolver from "./resolvers/User";
import QueryResolver from "./resolvers/Query";
import MutationResolver from "./resolvers/Mutation";

import { comparator } from "../utils/helper";

import config from "../utils/config";

const pubsub = new PubSub();

const currLocation = [19, 19];
const pricePerUnit = 20;

const multipleOrders: PriorityQueue<Order>[] = [];

// initialise OrderQueue
(async () => {
	const angleForEachSection = Math.floor(360 / config.SECTIONS);
	const orders: Order[] = (await order.find({ status: "ordered" })).map((o: MongooseDocument): any => ({ ...o.toJSON(), arrivalTime: o.get("arrivalTime")?.getTime() }));
	orders
		.forEach(o => {
			let index = o.angle / angleForEachSection;
			if (multipleOrders[index]) {
				multipleOrders[index].queue(o)
			} else {
				multipleOrders[index] = new PriorityQueue<Order>({
					comparator,
					initialValues: [o]
				});
			}
		});
	// console.log(multipleOrders.map(p => p.peek()));
})();

export default {
	Query: {
		...QueryResolver(multipleOrders, pubsub)
	},
	Mutation: {
		...MutationResolver(multipleOrders, pubsub, currLocation, pricePerUnit)
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
	}
};