const {tester} = require("graphql-tester");

import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/cookieman-test", {
	useUnifiedTopology: true,
	useCreateIndex: true,
	autoIndex: true,
	useNewUrlParser: true,
	useFindAndModify: false
});

import deliveryPersonel from "./models/deliveryPersonel";
import order from "./models/order";
// import {tester} from "graphql-tester";

// const tests = [{
// 	id: "Query hello",
// 	query: `query{
// 		hello
// 	}`,
// 	variables: {},
// 	context: {},
// 	expected: {
// 		data: {
// 			hello: "world"
// 		}
// 	}
// },{
// 	id: "Mutation addDeliveryPersonel",
// 	query: `mutation ($name: String!, $number: String!){
// 		addDeliveryPersonel(name: $name, number: $number){
// 			name, number, history
// 		}
// 	}`,
// 	variables: {
// 		name: "test",
// 		number: "0000000000"
// 	},
// 	expected: {
// 		data: {
// 			addDeliveryPersonel: {
// 				name: "test",
// 				number: "0000000000",
// 				history: []
// 			}
// 		}
// 	}
// }];

const ExpressTest = tester({
	url: "http://localhost:3000/api/graphql-test",
	contentType: 'application/json'
})

describe("initial test",()=> {

	test("just a test",() => {
		expect(true).toBe(true);
	});

});

describe("graphql tests",()=> {

	beforeEach(async () => {
		await deliveryPersonel.deleteMany({});
		await order.deleteMany({});
	});

	// tests.forEach((t) => {
	// 	const {id, query,variables,expected} = t;
	// 	test(`Test: ${id}`,async () => {
	// 		const res = await ExpressTest(JSON.stringify({query, variables}));
	// 		// console.log(res);
	// 		expect(res.status).toEqual(200);
	// 		expect(res.data).toStrictEqual(expected.data);
	// 	})
	// });

	test("Test: Query hello",async () => {
		const res = await ExpressTest(JSON.stringify({
			query: `query {hello}`
		}));
		expect(res.status).toEqual(200);
		expect(res.data).toStrictEqual({"hello": "world"});
	});

	describe("Testing : Mutate addDeliveryPeronel",() => {

		test("Testing illegal value number smaller than 10",async () => {
			const res = await ExpressTest(JSON.stringify({
				query: `mutation ($name: String!, $number: String!){
					addDeliveryPersonel(name: $name, number: $number){
						name, number, history
					}
				}`,
				variables: {
					name: "test",
					number: "000000000"
				}
			}));
			expect(res.status).toBe(200);
			expect(res.success).toBe(false);
			expect(res.data).toStrictEqual({"addDeliveryPersonel":null});
			expect(res.errors).toBeDefined();
		});

		test("Testing illegal value number greater than 10", async () => {
			const res = await ExpressTest(JSON.stringify({
				query: `mutation ($name: String!, $number: String!){
					addDeliveryPersonel(name: $name, number: $number){
						name, number, history
					}
				}`,
				variables: {
					name: "test",
					number: "00000000000"
				}
			}));
			expect(res.status).toBe(200);
			expect(res.success).toBe(false);
			expect(res.data).toStrictEqual({ "addDeliveryPersonel": null });
			expect(res.errors).toBeDefined();
		});

		test("Testing illegal value by not sending number", async () => {
			const res = await ExpressTest(JSON.stringify({
				query: `mutation ($name: String!, $number: String!){
					addDeliveryPersonel(name: $name){
						name, number, history
					}
				}`,
				variables: {
					name: "test",
					number: "00000000000"
				}
			}));
			expect(res.status).toBe(400);
			expect(res.success).toBe(false);
			expect(res.data).toBeUndefined();
			expect(res.errors).toBeDefined();
		});

		test("Testing legal value", async () => {
			const res = await ExpressTest(JSON.stringify({
				query: `mutation ($name: String!, $number: String!){
					addDeliveryPersonel(name: $name, number: $number){
						name, number, history
					}
				}`,
				variables: {
					name: "test",
					number: "0000000000"
				}
			}));
			expect(res.success).toBe(true);
			expect(res.data).toStrictEqual({ 
				"addDeliveryPersonel": {
					name: "test",
					number: "0000000000",
					history: []
				} 
			});
		});

	});

	describe("Testing: Mutate placeOrders",() => {

		test("Testing legal values",async () => {
			const res = await ExpressTest(JSON.stringify({
				query: `mutation($customerName: String!, $customerNumber: String!, $customerAddress: String!, $quantity: Int!, $lat: Float!, $long: Float!){
					placeOrder(
						customerName: $customerName,
						customerNumber: $customerNumber,
						customerAddress: $customerAddress,
						quantity: $quantity,
						lat: $lat,
						long: $long,
					) {
						customerName, customerNumber, customerAddress, quantity
					}
				}`,
				variables: {
					"quantity": 20,
					"lat": 10,
					"long": 10,
					"customerName": "Animesh Ghosh",
					"customerNumber": "8888888888",
					"customerAddress": "Parel, Mumbai"
				}
			}));

			expect(res.success).toBe(true);
			expect(res.data).toStrictEqual({
				"placeOrder" : {
					"quantity": 20,
					"customerName": "Animesh Ghosh",
					"customerNumber": "8888888888",
					"customerAddress": "Parel, Mumbai"
				}
			});
		});

		test("Testing illegal values", async () => {
			const res = await ExpressTest(JSON.stringify({
				query: `mutation($customerName: String!, $customerNumber: String!, $customerAddress: String!, $quantity: Int!, $lat: Float!, $long: Float!){
					placeOrder(
						customerName: $customerName,
						customerNumber: $customerNumber,
						customerAddress: $customerAddress,
						quantity: $quantity,
						lat: $lat,
					) {
						customerName, customerNumber, customerAddress, quantity
					}
				}`,
				variables: {
					"quantity": 20,
					"lat": 10,
					"long": 10,
					"customerName": "Animesh Ghosh",
					"customerNumber": "8888888888",
					"customerAddress": "Parel, Mumbai"
				}
			}));
			expect(res.status).toBe(400);
			expect(res.success).toBe(false);
			expect(res.data).toBeUndefined();
			expect(res.errors).toBeDefined();
		});

	});
});

afterAll(() => {
	mongoose.connection.close();
})