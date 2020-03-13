import { GraphQLFieldConfigArgumentMap } from "graphql";

import { User, Order } from "../../utils/interfaces";

import { ApolloError, PubSub } from "apollo-server-express";

import { MongooseDocument } from "mongoose";

import Users from "../../models/user";
import order from "../../models/order";

import PriorityQueue from "ts-priority-queue";

import axios from "axios";
import config from "../../utils/config";

// O(n) allowed as length of mo will be no. of sections which should be maximum of 360(worst case)
const findMaxOrdersInACluster = (mo: PriorityQueue<Order>[]): number[] => {
	let m = 0, loc = -1;
	for (let i = 0; i < mo.length; i++) {
		if (mo[i] && mo[i].length > m) {
			loc = i; m = mo[i].length;
		}
	}
	return [m, loc];
}

export const QueryResolver = (MultipleOrders: PriorityQueue<Order>[], pubsub: PubSub, currLocation: number[]) => ({
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

		// SETTING A LIMIT ON MAX NO. OF ORDERS THAT A DELIVERY PERSON CAN TAKE AT A TIME, CAN HELP SCALE
		let noOfOrders = Math.min(maxOrders, 9);
		// SPECIFICALLY 9 AS at a time mapbox API can only give results for 10 coordinate points
		let deliverPersonelId = id;
		if (category === "admin") {
			deliverPersonelId = args.deliverPersonelId;
		}
		const dP = (await Users.findById(deliverPersonelId));
		if (dP === null || dP === undefined || dP.get("category") !== category) {
			throw new ApolloError(`Inavlid token. Please login again`, "FORBIDDEN");
		}

		const fetchcurrentOrders = await order.find({ deliveryPersonel: deliverPersonelId, status: "assigned" });

		if (fetchcurrentOrders.length !== 0) {
			throw new ApolloError(`You already have pending orders. Please complete them first.`, "FORBIDDEN");
		}
		const toBeDelivered: Order[] = [];
		const updatedDP: User = { ...dP.toJSON() };
		updatedDP.currentOrders = [];

		let destLatLong = "";

		for (let i = 0; i < noOfOrders - 1; i++) {
			let tempOrder = MultipleOrders[index].dequeue()
			toBeDelivered.push(tempOrder);
			// destLatLong.push({
			// 	"latitue": tempOrder.lat,
			// 	"longitude": tempOrder.long
			// });
			destLatLong += `${tempOrder.lat},${tempOrder.long};`
		};
		let temp = MultipleOrders[index].dequeue();
		toBeDelivered.push(temp);
		destLatLong += `${temp.lat},${temp.long}`
		// console.log(toBeDelivered);
		try {
			const res = (await axios.get(`https://dev.virtualearth.net/REST/v1/Routes/DistanceMatrix?origins=${currLocation[0]},${currLocation[1]}&destinations=${destLatLong}&travelMode=driving&timeUnit=second&key=${config.BING_MAPS_KEY}`)).data;
			// const res = (await axios.get(`https://dev.virtualearth.net/REST/v1/Routes/DistanceMatrix?origins=47.6044,-122.3345;47.6731,-122.1185;47.6149,-122.1936&destinations=45.5347,-122.6231;47.4747,-122.2057&travelMode=driving&timeUnit=second&key=${config.BING_MAPS_KEY}`)).data;

			// console.log(res.resourceSets[0].resources[0].results);
			const sumOfAllEta = res.resourceSets[0].resources[0].results.reduce((p: number, c: any): number => p + c.travelDuration, 0)
			res.resourceSets[0].resources[0].results.forEach((r: any) => {
				toBeDelivered[r.destinationIndex].eta = new Date(Date.now() + 1000 + sumOfAllEta * 1000 + 360000)
			});
		} catch (e) {
			console.error(e);
		}


		for (let i = 0; i < noOfOrders; i++) {
			let tempOrder = toBeDelivered[i];
			updatedDP.currentOrders.push(tempOrder.id);
			updatedDP.history?.push(tempOrder.id);

			tempOrder.deliveryPersonel = updatedDP;
			tempOrder.status = "assigned"
			await order.findByIdAndUpdate(tempOrder.id, {
				...tempOrder,
				user: tempOrder.user.id,
				deliveryPersonel: tempOrder.deliveryPersonel.id
			});

			pubsub.publish("ORDER_UPDATE", {
				orderTracking: tempOrder
			});

			// toBeDelivered.push(tempOrder);
		}

		await Users.findByIdAndUpdate(updatedDP.id, updatedDP);
		// console.log(toBeDelivered);
		return toBeDelivered;
	},
	getOrders: async (_: void, args: GraphQLFieldConfigArgumentMap, context: any): Promise<any> => {
		const { isAuthenticated, id, category } = context;
		if (!isAuthenticated) {
			throw new ApolloError("Login Required", "FORBIDDEN");
		}
		const u = await Users.findById(id);
		if (u === null || u === undefined || u.get("category") !== category) {
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

		let page: number;
		if (args.page === undefined) {
			page = 0
		} else {
			page = parseInt(args.page.toString() || '0');
		}

		const o = await Promise.all((await order.find(options).skip(10 * page).limit(10)).map(async (or: MongooseDocument) => {
			return await (await or.populate("user").populate("deliveryPersonel").execPopulate()).toJSON()
		}));
		// console.log(o);
		return o;
	}

});

export default QueryResolver;