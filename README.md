# COOKIE-PEOPLE

We sell cookies online to people who can buy them.

### What is this repository for? ###

* Summary: It is the backend for a cookie delivery application
* Version: 1.0.0
* URL(Playground): https://cookieman98.herokuapp.com/api/graphql

### How do I get set up? ###

* Summary of set up: There are 2 two ways to run this application: local and cloud.
* Configuration: The server needs the following environment variables when in PRODUCTION mode: PORT, GRAPHQL_ROUTE, MONGODB_URI, NODE_ENV. For each and every other mode like dev or test specify these env variables with `_<mode>` for eg PORT_TEST in test mode
* Dependencies: Can be found in package.json
* Database configuration: Can be found in models
* Deployment instructions: On local machine either run `docker-compose up` or install mongodb daemon, start that daemon and then `npm start` or `npm run watch`

### Architecture ###

1. The tech stack for the application is:
    * Backend: TypeScript, ts-node, express, apollo-server-express, graphQL, mongodb
    * Frontend: ReactJS, apollo-client

2. The system has 3 types of user base: admin, delivery personel and customer and hence system revolves around these aspects

3. GraphQL schema:
  ```graphql
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
		id: ID!,
		user: User!,
		customerAddress: String!,
		quantity: Int!,
		price: Int!,
		distance: Int!,
		barcodePath: String!,
		status: String!,
		deliveryPersonel: User,
		eta: String
	}
	type Query {
		hello : String!,
		# Fetch All users(if non root for current logged in user only)
		getUsers(
			category: String, 
			page: Int
		): [User!]!,
		# Fetch all orders(if non root for current logged in user only)
		getOrders(id: ID, status: String, page: Int): [Order!]!,
		# Long Polling query for frontend for delivery personels to accpet new orders
		acceptOrderForDelivery(deliveryPersonelId: ID): [Order!]
	}
	type Mutation {
		# Add user(deliveryPersonel or customer) 
		addUser(
			email: String!,
			name: String!,
			number: String!,
			address: String,
			password: String!,
			category: String!
		): token!,
		# Place an order(customer only)
		placeOrder(
			customerAddress: String,
			quantity: Int!,
			lat: Float!,
			long: Float!
		): Order!,
		# Mutation for order completion verification
		completeOrder(
			orderId: ID!,
			text: String!
		): Boolean!,
		# Mutation to login
		login(
			email: String!,
			password: String!
		): token!
	},
	type Subscription {
		# Subscriptions for usert to track updates
		orderTracking(
			orderId: ID!
		): Order!
	}
  ```
 
 4. Flow
      1. Add delivery personels to the system (addUser)
      2 Order cookies from the store(placeOrder) and subscribe to order updates(orderTracking)
      3. Long polling by delivery personel client until order is available and delivery personel is free.
      4. The system v2 has a new clustering technique based on the latitude, longitude of the customer. The system divides the entire area in pseudo sections using angular geometry and any order belonging to the same section is attempted to be delivered together. But the system limits to 9 orders per section to decrease load on the delivery personel as well as map APIs. Each cluster is essentially a priority queue from which the orders are fetched on the basis of 
      	* if orders arrived 10 mins apart each other then the order that came first should be served first else
	* The order closer to cookie shop (static (lat: latitude, long: longitude) => (19,19) => coordinates of the cookie shop)
      5. Notify the client about order that is sent out using publish subscriber model of apollo graphQL servers.
      6. Delivery perosnel scans the QR code that is given to customer and return the result to server for validation that cookie is delivered (verification of QR code to authenticate the presence of delivery personel on site).
      7. Client can enjoy cookies now!! And re-order them as well.
      8. Delivery Personel is now free and can again start long polling the server for new orders.
      
5. Why long polling and not cron job with subscriptions?
  <p>Instead of wasting computational time on guessing when the delivery personel will be available, we make the delivery personel ask for new orders whenever he/she is ready. Drawback is this increases unnecessary new traffic that could be many times useless</p>
  
### Demo ###

1. Add delivery Personel <img src="https://github.com/NightWing1998/CookieMan/blob/master/addDeliveryPersonal.gif" />
2. Place Order <img src="https://github.com/NightWing1998/CookieMan/blob/master/placeOrder.gif" />
3. Delivery personels long polling for orders <img src="https://github.com/NightWing1998/CookieMan/blob/master/long%20polling.gif" />
4. Delivery personel scanning QR codes <img src="https://github.com/NightWing1998/CookieMan/blob/master/scan%20QR%20code.gif" />
5. Completing delivery and client side subscription <img src="https://github.com/NightWing1998/CookieMan/blob/master/delivered%20and%20subscription.gif" />

### Who do I talk to? ###

* @NightWing1998 <a href="mailto:dsdruvil8@gmail.com">Mail</a> Phone No: +91 9969326535/ 8850392965
