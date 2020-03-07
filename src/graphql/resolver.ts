import { GraphQLFieldConfigArgumentMap } from "graphql";

import deliveryGuy from "../models/deliveryGuy";
import { MongooseDocument } from "mongoose";

interface DeliveryGuy {
	name: string,
	number: string,
	history: [string | null],
	id: string
}

export default {
	Query: {
		hello: (): string => "world",
		getDeliveryGuys: async (_: void, args: GraphQLFieldConfigArgumentMap): Promise<DeliveryGuy[]> => {
			const { id } = args;
			if (id === undefined) {
				const dGs = (await deliveryGuy.find({})).map((guy: MongooseDocument) => guy.toJSON());
				if (dGs === undefined || dGs === null) return [];
				else return dGs;
			} else {
				const dG = (await deliveryGuy.findById(id))?.toJSON();
				if (dG === undefined || dG === null) return [];
				else return [dG];
			}
		}
	},
	Mutation: {
		addDeliveryGuy: async (_: void, args: GraphQLFieldConfigArgumentMap): Promise<DeliveryGuy> => {
			const { name, number } = args;
			const newGuy = (await deliveryGuy.create({ name, number })).toJSON();
			// console.log("#", newGuy);
			return newGuy;
		}
	}
};