import { gql } from "apollo-server-express";

export default gql`
	type DeliveryGuy {
		name: String!,
		number: String!,
		id: ID!,
		history: [ID]!
	}
	type Query {
		hello : String!,
		getDeliveryGuys(
			id: ID
		): [DeliveryGuy!]!
	}
	type Mutation {
		addDeliveryGuy(
			name: String!,
			number: String!
		): DeliveryGuy,
	}
`;