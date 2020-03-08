import { GraphQLFieldConfigArgumentMap } from "graphql";

import deliveryPersonel from "../models/deliveryPersonel";
import order from "../models/order";
import { MongooseDocument } from "mongoose";

import qrcode from "qrcode";
import md5 from "md5";

import { resolve } from "path";
import { ApolloError, PubSub, withFilter } from "apollo-server-express";

import PriorityQueue from "ts-priority-queue";

const pubsub = new PubSub();

interface DeliveryPersonel {
	name: string,
	number: string,
	history: string[],
	id: string,
	currentOrder?: string
}

interface Order {
	customerName: string,
	customerNumber: string,
	customerAddress: string,
	id: string,
	quantity: number,
	price: number,
	distance: number,
	barcodePath: string,
	status: string,
	relativeArrivalTime: number,
	deliveryPersonel?: DeliveryPersonel
}

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
		hello: (): string => "world",
		getDeliveryPersonels: async (_: void, args: GraphQLFieldConfigArgumentMap): Promise<DeliveryPersonel[]> => {
			const { id } = args;
			if (id === undefined) {
				const dGs = (await deliveryPersonel.find({})).map((guy: MongooseDocument) => guy.toJSON());
				if (dGs === undefined || dGs === null) return [];
				else return dGs;
			} else {
				const dG = (await deliveryPersonel.findById(id))?.toJSON();
				if (dG === undefined || dG === null) return [];
				else return [dG];
			}
		},
		getOrders: async (_: void, args: GraphQLFieldConfigArgumentMap): Promise<any> => {
			const { id } = args;
			if (id === undefined) {
				const os = (await order.find({}));
				return os.map(async (og: MongooseDocument): Promise<Order> => {
					const o = (await og.populate("deliveryPersonel").execPopulate()).toJSON();
					return ({
						...o,
						relativeArrivalTime: o.arrivalTime.getTime() - startTime[0]
					})
				})
			} else {
				const og = (await order.findById(id).populate("deliveryPersonel"));
				if (og === null) {
					throw new ApolloError(`${id} order does not exist.`, "INVALID_ORDER_ID");
				} else {
					const o = og.toJSON();
					// console.log(o);
					return [{
						...o,
						relativeArrivalTime: o.arrivalTime.getTime() - startTime[0]
					}];
				}
			}
		},
		acceptOrderForDelivery: async (_: void, args: GraphQLFieldConfigArgumentMap): Promise<Order | null> => {
			if (OrdersQueue.length === 0) {
				return null;
			} else {
				const { deliveryPersonelId } = args;
				const dP = await deliveryPersonel.findById(deliveryPersonelId.toString());
				if (dP === null) {
					throw new ApolloError(`delivery personel with id - ${deliveryPersonelId} does not exist. Please check the deliveryPersonelId`, "INVALID_DELIVERY_PERSONEL_ID");
				} else if (dP.toJSON().currentOrder !== undefined && dP.toJSON().currentOrder !== null) {
					throw new ApolloError(`delivery personel with id - ${deliveryPersonelId} is already assigned order - ${dP.toJSON().currentOrder}. Please complete that first`, "DELIVERY_PERSONAL_BUSY");
				}
				const orderFromQueue = OrdersQueue.dequeue();
				const oldOrder = await order.findById(orderFromQueue.id);
				if (oldOrder === null || oldOrder.toJSON().status !== "ordered") {
					throw new ApolloError(`Server has invalid cache. Please report this issue.`, "INTERNAL_SERVER_ERROR");
				}
				const oJ = oldOrder.toJSON();
				const updatedOrder: Order = {
					...oJ,
					relativeArrivalTime: oJ.arrivalTime.getTime() - startTime[0],
					deliveryPersonel: dP.toJSON(),
					status: "assigned",
				};
				const newStatusOfDP = {
					...dP.toJSON(),
					history: [...dP.toJSON().history].concat(updatedOrder.id),
					currentOrder: updatedOrder.id
				};
				await dP.updateOne(newStatusOfDP);
				await oldOrder.updateOne({
					...updatedOrder,
					deliveryPersonel: dP._id,
					status: "assigned",
				});
				pubsub.publish("ORDER_UPDATE", {
					orderTracking: updatedOrder
				});
				return updatedOrder;
			}
		}
	},
	Mutation: {
		addDeliveryPersonel: async (_: void, args: GraphQLFieldConfigArgumentMap): Promise<DeliveryPersonel> => {
			const { name, number } = args;
			const newPersonel = (await deliveryPersonel.create({ name, number })).toJSON();
			// console.log("#", newPersonel);
			return newPersonel;
		},
		placeOrder: async (_: void, args: GraphQLFieldConfigArgumentMap): Promise<Order> => {
			if (OrdersQueue.length === 0) {
				startTime[0] = Date.now();
			}
			const currLocation = [19, 19];
			const pricePerUnit = 20;
			const { customerName, customerNumber, lat, long, customerAddress, quantity } = args;
			const distance = Math.sqrt(Math.pow((currLocation[0] - parseFloat(lat.toString())), 2) + Math.pow(currLocation[1] - parseFloat(long.toString()), 2));
			// console.log(name, number, lat.toString(), long.toString(), address, quantity, distance, pricePerUnit * parseInt(quantity.toString()));
			let filename = `${customerName}_${Date.now()}.png`;
			const barcodePath = resolve(__dirname, "..", "..", "barcodes", filename);
			await qrcode.toFile(barcodePath, md5(`${customerName}_${customerNumber}_${customerAddress}_${distance}_${quantity}`));
			const newO = (await order.create({
				customerName, customerNumber, customerAddress, distance, quantity,
				price: pricePerUnit * parseInt(quantity.toString()),
				barcodePath: `/barcodes/${filename}`
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
			if (md5(`${customerName}_${customerNumber}_${customerAddress}_${distance}_${quantity}`) === text.toString()) {
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
		}
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
	}
};