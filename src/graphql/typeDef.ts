import { gql } from "apollo-server-express";

export default gql`
	type User {
		name: String!,
		number: String!,
		id: ID!,
		currentOrders: [ID]!,
		history: [ID]!
	}
	type token{
		token: String!
	}
	type Order {
		userId: User!,
		customerAddress: String!,
		quantity: Int!,
		price: Int!,
		distance: Int!,
		barcodePath: String!,
		status: String!,
		deliveryPersonel: User
	}
	type Query {
		hello : String!,
		getUsers(
			category: String, 
			page: Int
		): [User!]!,
		getOrders(id: ID): [Order!]!,
		acceptOrderForDelivery(deliveryPersonelId: ID!): [Order!]!
	}
	type Mutation {
		addUser(
			email: String!,
			name: String!,
			number: String!,
			address: String,
			password: String!,
			category: String!
		): token!,
		placeOrder(
			userId: ID!,
			customerAddress: String!,
			quantity: Int!,
			lat: Float!,
			long: Float!
		): Order!,
		completeOrder(
			deliveryPersonelId: ID!,
			text: String!
		): Boolean!,
		login(
			email: String!,
			password: String!
		): token!
	},
	type Subscription {
		orderTracking(
			orderId: ID!
		): Order!
	}
`;