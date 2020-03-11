import { GraphQLFieldConfigArgumentMap } from "graphql";

import deliveryPersonel from "../models/deliveryPersonel";
import order from "../models/order";
import { MongooseDocument } from "mongoose";

import qrcode from "qrcode";
import md5 from "md5";

import { resolve } from "path";
import { ApolloError, PubSub, withFilter } from "apollo-server-express";

import PriorityQueue from "ts-priority-queue";

import { Order } from "./interfaces";

import UserResolver from "./resolvers/User";
import QueryResolver from "./resolvers/Query";
import MutationResolver from "./resolvers/Mutation";

const pubsub = new PubSub();

const startTime = [Date.now()];

const comparingPriority = (a: Order, b: Order): number => {
	let temp = a.relativeArrivalTime - b.relativeArrivalTime;
	if (Math.abs(temp) > 600000) {
		return temp;
	} else {
		return a.distance - b.distance;
	}
}

const OrdersQueue: PriorityQueue<Order> = new PriorityQueue({
	comparator: comparingPriority
});


// initialise OrderQueue
(async () => {
	const orders: Order[] = (await order.find({ status: "ordered" })).map((o: MongooseDocument): any => ({ ...o.toJSON(), relativeArrivalTime: o.toJSON().arrivalTime.getTime() - startTime[0] }));
	orders.forEach(o => OrdersQueue.queue(o));
	// console.log(OrdersQueue.peek());
})();

export default {
	Query: {
		...QueryResolver(OrdersQueue, pubsub)
	},
	Mutation: {
		placeOrder: async (_: void, args: GraphQLFieldConfigArgumentMap): Promise<Order> => {
			if (OrdersQueue.length === 0) {
				startTime[0] = Date.now();
			}
			const currLocation = [19, 19];
			const pricePerUnit = 20;
			const { customerName, customerNumber, lat, long, customerAddress, quantity } = args;
			const distance = Math.sqrt(Math.pow((currLocation[0] - parseFloat(lat.toString())), 2) + Math.pow(currLocation[1] - parseFloat(long.toString()), 2));

			// console.log(name, number, lat.toString(), long.toString(), address, quantity, distance, pricePerUnit * parseInt(quantity.toString()));
			const current = Date.now();
			let filename = `${customerName}_${current}.png`;
			const barcodePath = resolve(__dirname, "..", "..", "barcodes", filename);
			await qrcode.toFile(barcodePath, md5(`${customerName}_${customerNumber}_${customerAddress}_${distance}_${quantity}_${current}`));
			const newO = (await order.create({
				customerName, customerNumber, customerAddress, distance, quantity,
				price: pricePerUnit * parseInt(quantity.toString()),
				barcodePath: `/barcodes/${filename}`,
				arrivalTime: new Date(current)
			}));
			const newOrder = (await newO.populate("deliveryPersonel").execPopulate()).toJSON();
			let o: Order = {
				...newOrder,
				relativeArrivalTime: newOrder.arrivalTime.getTime() - startTime[0]
			}
			// console.log(o);
			OrdersQueue.queue(o);
			return o;
		},
		completeOrder: async (_: void, args: GraphQLFieldConfigArgumentMap): Promise<boolean> => {
			const { deliveryPersonelId, text } = args;
			const dP = (await deliveryPersonel.findById(deliveryPersonelId.toString()).populate("currentOrder"));
			if (dP === null || dP === undefined) {
				throw new ApolloError(`delivery personel with id - ${deliveryPersonelId.toString()} does not exist.Please check the deliveryPersonelId`, "INVALID_DELIVERY_PERSONEL_ID");
			} else if (dP.toJSON().currentOrder === undefined || dP.toJSON().currentOrder === null) {
				throw new ApolloError(`delivery personel with id - ${deliveryPersonelId.toString()} is currently idle. Please accept an order first`, "DELIVERY_PERSONEL_IDLE");
			}
			const { customerName, customerAddress, customerNumber, distance, quantity, price, barcodePath, arrivalTime } = dP.toJSON().currentOrder;
			const OrderId = dP.toJSON().currentOrder.id;
			if (md5(`${customerName}_${customerNumber}_${customerAddress}_${distance}_${quantity}_${arrivalTime.getTime()}`) === text.toString()) {
				await dP.updateOne({
					...dP.toJSON(),
					currentOrder: null
				});
				(await order.findByIdAndUpdate(OrderId, {
					status: "delivered"
				}, { new: true }));
				const updatedOrder: Order = {
					customerName, customerAddress, customerNumber, distance, quantity, price,
					barcodePath, status: "delivered",
					relativeArrivalTime: arrivalTime - startTime[0],
					id: OrderId,
					deliveryPersonel: {
						...dP.toJSON()
					}
				}
				pubsub.publish("ORDER_UPDATE", {
					orderTracking: updatedOrder
				});
				return true;
			} else {
				return false;
			}
		},
		...MutationResolver(OrdersQueue, pubsub)
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