import { GraphQLFieldConfigArgumentMap } from "graphql";

// import deliveryPersonel from "../models/deliveryPersonel";
import order from "../models/order";
import { MongooseDocument } from "mongoose";

// import md5 from "md5";

// import { ApolloError, PubSub, withFilter } from "apollo-server-express";
import { PubSub, withFilter } from "apollo-server-express";

import PriorityQueue from "ts-priority-queue";

import { Order } from "./interfaces";

import UserResolver from "./resolvers/User";
import QueryResolver from "./resolvers/Query";
import MutationResolver from "./resolvers/Mutation";

import config from "../utils/config";

const pubsub = new PubSub();

const currLocation = [19, 19];
const pricePerUnit = 20;

const comparingPriority = (a: Order, b: Order): number => {
	let temp = a.arrivalTime - b.arrivalTime;
	if (Math.abs(temp) > 600000) {
		return temp;
	} else {
		return a.distance - b.distance;
	}
}

const OrdersQueue: PriorityQueue<Order> = new PriorityQueue({
	comparator: comparingPriority
});

const multipleOrders: Order[][] = [];

// initialise OrderQueue
(async () => {
	const angleForEachSection = Math.floor(360 / config.SECTIONS);
	const orders: Order[] = (await order.find({ status: "ordered" })).map((o: MongooseDocument): any => ({ ...o.toJSON(), relativeArrivalTime: o.get("arrivalTime")?.getTime() }));
	orders
		.forEach(o => {
			OrdersQueue.queue(o);
			let index = o.angle / angleForEachSection;
			if (multipleOrders[index]) {
				multipleOrders[index].push(o)
			} else {
				multipleOrders[index] = [o];
			}
		});
	// console.log(OrdersQueue.peek());
})();

export default {
	Query: {
		...QueryResolver(OrdersQueue, pubsub)
	},
	Mutation: {
		// completeOrder: async (_: void, args: GraphQLFieldConfigArgumentMap): Promise<boolean> => {
		// 	const { deliveryPersonelId, text } = args;
		// 	const dP = (await deliveryPersonel.findById(deliveryPersonelId.toString()).populate("currentOrder"));
		// 	if (dP === null || dP === undefined) {
		// 		throw new ApolloError(`delivery personel with id - ${deliveryPersonelId.toString()} does not exist.Please check the deliveryPersonelId`, "INVALID_DELIVERY_PERSONEL_ID");
		// 	} else if (dP.toJSON().currentOrder === undefined || dP.toJSON().currentOrder === null) {
		// 		throw new ApolloError(`delivery personel with id - ${deliveryPersonelId.toString()} is currently idle. Please accept an order first`, "DELIVERY_PERSONEL_IDLE");
		// 	}
		// 	const { customerName, customerAddress, customerNumber, distance, quantity, price, barcodePath, arrivalTime } = dP.toJSON().currentOrder;
		// 	const OrderId = dP.toJSON().currentOrder.id;
		// 	if (md5(`${customerName}_${customerNumber}_${customerAddress}_${distance}_${quantity}_${arrivalTime.getTime()}`) === text.toString()) {
		// 		await dP.updateOne({
		// 			...dP.toJSON(),
		// 			currentOrder: null
		// 		});
		// 		(await order.findByIdAndUpdate(OrderId, {
		// 			status: "delivered"
		// 		}, { new: true }));
		// 		const updatedOrder: Order = {
		// 			customerNumber, distance, quantity, price,
		// 			barcodePath, status: "delivered",
		// 			relativeArrivalTime: arrivalTime.getTime(),
		// 			id: OrderId,
		// 			deliveryPersonel: {
		// 				...dP.toJSON()
		// 			}
		// 		}
		// 		pubsub.publish("ORDER_UPDATE", {
		// 			orderTracking: updatedOrder
		// 		});
		// 		return true;
		// 	} else {
		// 		return false;
		// 	}
		// },
		...MutationResolver(OrdersQueue, multipleOrders, pubsub, currLocation, pricePerUnit)
	},
	Subscription: {
		orderTracking: {
			subscribe: withFilter(
				() => pubsub.asyncIterator(["ORDER_UPDATE"]),
				(payload: any, variables: GraphQLFieldConfigArgumentMap): boolean => {
					// console.log(payload, variables);
					const { orderId } = variables;
					return payload.orderTracking.id === orderId.toString()
				}
			)
		}
	},
	User: {
		...UserResolver()
	}
};