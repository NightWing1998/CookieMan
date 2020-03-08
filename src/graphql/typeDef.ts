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
		customerName: String!,
		customerNumber: String!,
		customerAddress: String!,
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
		acceptOrderForDelivery(deliveryPersonelId: ID!): Order
	}
	type Mutation {
		addDeliveryPersonel(
			name: String!,
			number: String!,
		): DeliveryPersonel,
		placeOrder(
			customerName: String!,
			customerNumber: String!,
			customerAddress: String!,
			quantity: Int!,
			lat: Float!,
			long: Float!
		): Order!,
		completeOrder(
			deliveryPersonelId: ID!,
			text: String!
		): Boolean!
	},
	type Subscription {
		orderTracking(
			orderId: ID!
		): Order!
	}
`;