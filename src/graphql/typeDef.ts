import { gql } from "apollo-server-express";

export default gql`
	type DeliveryPersonel {
		name: String!,
		number: String!,
		id: ID!,
		currentOrder: ID,
		history: [ID]!
	}
	type Order {
		id: ID!,
		name: String!,
		number: String!,
		address: String!,
		quantity: Int!,
		price: Int!,
		distance: Int!,
		barcodePath: String!,
		status: String!,
		deliveryPersonel: DeliveryPersonel
	}
	type Query {
		hello : String!,
		getDeliveryPersonels(
			id: ID
		): [DeliveryPersonel!]!,
		getOrders(id: ID): [Order]!,
	}
	type Mutation {
		addDeliveryPersonel(
			name: String!,
			number: String!,
		): DeliveryPersonel,
		placeOrder(
			name: String!,
			number: String!,
			address: String!,
			quantity: Int!,
			lat: Float!,
			long: Float!
		): Order!
	}
`;