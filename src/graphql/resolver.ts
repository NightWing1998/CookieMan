import { GraphQLFieldConfigArgumentMap } from "graphql";

import deliveryGuy from "../models/deliveryGuy";

interface DeliveryGuy {
	name: string,
	number: string,
	history: [string | null],
	id: string
}

export default {
	Query: {
		hello: (): string => "world"
	},
	Mutation: {
		addDeliveryGuy: async (_: void, args: GraphQLFieldConfigArgumentMap): Promise<DeliveryGuy> => {
			const { name, number } = args;
			const newGuy = (await deliveryGuy.create({ name, number })).toJSON();
			console.log("#", newGuy);
			return newGuy;
		}
	}
};