import { GraphQLFieldConfigArgumentMap } from "graphql";

import { User, Order } from "../../utils/interfaces";

import { ApolloError, PubSub } from "apollo-server-express";

import { MongooseDocument } from "mongoose";

import Users from "../../models/user";
import OrderModel from "../../models/order";

import PriorityQueue from "ts-priority-queue";

import axios from "axios";
import config from "../../utils/config";

import { extractDestinationLatLong } from "../../utils/helper";


// O(n) allowed as length of multipleOrders will be no. of sections which should be maximum of 360(worst case)
const findMaxOrdersInACluster = (multipleOrders: PriorityQueue<Order>[]): number[] => {
	let maxOrdersLength = 0, location = -1;
	for (let i = 0; i < multipleOrders.length; i++) {
		if (multipleOrders[i] && multipleOrders[i].length > maxOrdersLength) {
			location = i;
			maxOrdersLength = multipleOrders[i].length;
		}
	}
	return [maxOrdersLength, location];
}

export const QueryResolver = (MultipleOrders: PriorityQueue<Order>[], pubsub: PubSub, currentLocation: number[]) => ({
	// hello: (_: void, args: void, context: any): string => {
	hello: (): string => {
		// console.log("context: ", context);
		return "world"
	},
	getUsers: async (_: void, args: any, context: any): Promise<User[] | []> => {
		const { id, category, isAuthenticated } = context;
		if (!isAuthenticated) {
			throw new ApolloError("Login token required for fetching user data", "FORBIDDEN");
		}
		const user = (await Users.findById(id));
		if (user === null || user === undefined) {
			throw new ApolloError("Invalid data in token", "FORBIDDEN");
		}
		if (user.get("category") === category) {
			// TOKEN data and db data match go ahead and complete requests
			if (category === "admin") {
				let page = parseInt(args.page?.toString()) || 0;
				return (await Users.find({})
					.skip(10 * page)
					.limit(10)
				).map(singleUser => singleUser.toJSON());
			} else {
				return [user.toJSON()];
			}
		} else {
			throw new ApolloError("Invalid data in token", "FORBIDDEN");
		}
	},
	acceptOrderForDelivery: async (_: void, args: GraphQLFieldConfigArgumentMap, context: any): Promise<Order[] | null> => {
		const { isAuthenticated, id, category } = context;
		if (!isAuthenticated) {
			throw new ApolloError("Login required to accept orders.", "FORBIDDEN");
		} else if (category !== "deliverypersonel") {
			throw new ApolloError(`Invalid category {${category}} for accepting orders.`, "FORBIDDEN");
		}
		let [maxOrders, index] = findMaxOrdersInACluster(MultipleOrders);
		if (maxOrders === 0) {
			return null;
		}

		let deliverPersonelId = id;
		if (category === "admin") {
			deliverPersonelId = args.deliverPersonelId?.toString();
		}
		const deliveryPersonel = (await Users.findById(deliverPersonelId));

		if (deliveryPersonel === null || deliveryPersonel === undefined || deliveryPersonel.get("category") !== category) {
			throw new ApolloError(`Inavlid token. Please login again`, "FORBIDDEN");
		}

		const fetchcurrentOrders = await OrderModel.find({ deliveryPersonel: deliverPersonelId, status: "assigned" });

		// IF DELIVERY PERSONEL HAS ORDERS ALREADY ASSIGNED THEN THROW ERROR AS NO NEW ORDERS CAN BE ACCEPTED WHILE DELIVERING ORDERS
		if (fetchcurrentOrders.length !== 0) {
			throw new ApolloError(`You already have pending orders. Please complete them first`, "FORBIDDEN");
		}

		// SETTING A LIMIT ON MAX NO. OF ORDERS THAT A DELIVERY PERSON CAN TAKE AT A TIME, CAN HELP SCALE
		let noOfOrders = Math.min(maxOrders, 9);

		const toBeDelivered: Order[] = [];

		for (let i = 0; i < noOfOrders; i++) {
			toBeDelivered.push(MultipleOrders[index].dequeue());
		}

		let destLatLong = extractDestinationLatLong(toBeDelivered);

		try {
			const res = (await axios.get(`https://dev.virtualearth.net/REST/v1/Routes/DistanceMatrix?origins=${currentLocation[0]},${currentLocation[1]}&destinations=${destLatLong}&travelMode=driving&timeUnit=second&key=${config.BING_MAPS_KEY}`)).data;

			const distanceAndTimeMatrix = res.resourceSets[0].resources[0].results; // travelDuration --> seconds not ms.

			// sumOfAllEta - MAXIMUM TIME TO SERVE ALL THE ORDERS FROM COOKIE SHOP CONSIDERING THEY ARE SERVED ALONE
			const sumOfAllEta = distanceAndTimeMatrix.reduce((sum: number, currentCell: any): number => sum + currentCell.travelDuration, 0)

			// ADDING BUFFER TIME AN HOUR TO COMPENSATE FOR ANY DELAY
			const etaForAll = new Date(Date.now() + 1000 + sumOfAllEta * 1000 + 360000);
			distanceAndTimeMatrix.forEach((cell: any) => {

				toBeDelivered[cell.destinationIndex].eta = etaForAll;

			});
		} catch (e) {
			console.error(e);
		}


		for (let i = 0; i < noOfOrders; i++) {
			let tempOrder = toBeDelivered[i];

			tempOrder.deliveryPersonel = { ...deliveryPersonel.toJSON() };
			tempOrder.status = "assigned"
			await OrderModel.findByIdAndUpdate(tempOrder.id, {
				...tempOrder,
				user: tempOrder.user.id,
				deliveryPersonel: tempOrder.deliveryPersonel?.id
			});

			pubsub.publish("ORDER_UPDATE", {
				orderTracking: tempOrder
			});

		}

		return toBeDelivered;
	},
	getOrders: async (_: void, args: GraphQLFieldConfigArgumentMap, context: any): Promise<any> => {
		const { isAuthenticated, id, category } = context;
		if (!isAuthenticated) {
			throw new ApolloError("Login Required", "FORBIDDEN");
		}
		const user = await Users.findById(id);
		if (user === null || user === undefined || user.get("category") !== category) {
			throw new ApolloError(`Inavlid token. Please login again`, "FORBIDDEN");
		}

		const { id: orderId, status } = args;
		let options: any = {};
		if (orderId) {
			options["_id"] = orderId.toString();
		}
		if (status) {
			options["status"] = status.toString();
		}
		if (category === "deliverypersonel") {
			options["deliveryPersonel"] = id;

		} else if (category === "customer") {
			options["user"] = id;
		}

		let page = parseInt(args.page?.toString()) || 0;

		const orders = await Promise.all(
			(await OrderModel.find(options)
				.skip(10 * page)
				.limit(10)
			).map(async (order: MongooseDocument) => {
				return await (await order.populate("user").populate("deliveryPersonel").execPopulate()).toJSON()
			})
		);
		// console.log(o);
		return orders;
	}

});

export default QueryResolver;