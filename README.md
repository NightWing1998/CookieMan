# COOKIE-PEOPLE

We sell cookies online to people who can buy them.

### What is this repository for? ###

* Summary: It is the backend for a cookie delivery application
* Version: 1.0.0
* URL: https://cookieman98.herokuapp.com/api/graphql

### How do I get set up? ###

* Summary of set up: There are 2 two ways to run this application: local and cloud.
* Configuration: The server needs the following environment variables when in PRODUCTION mode: PORT, GRAPHQL_ROUTE, MONGODB_URI, NODE_ENV. For each and every other mode like dev or test specify these env variables with `_<mode>` for eg PORT_TEST in test mode
* Dependencies: Can be found in package.json
* Database configuration: Can be found in models
* How to run tests
* Deployment instructions: On local machine either run `docker-compose up` or install mongodb daemon, start that daemon and then `npm start` or `npm run watch`
* Testing on local machine(only supported on local machine):
    * Install mongodb on local machine
    * Configure TEST env like NODE_ENV, PORT_TEST, MONGODB_URI_TEST(mongodb://localhost:27017/cookieman-test) and GRAPHQL_ROUTE_TEST
    * run local server using `npm run watch` or `npm start`
    * then run `npm run test`

### Architecture ###

1. The tech stack for the application is:
    * Backend: TypeScript, ts-node, express, apollo-server-express, graphQL, mongodb
    * Frontend: ReactJS, apollo-client
  
2. GraphQL schema:
  ```graphql
    type Query {
    # Fetch all Delivery Personel
		getDeliveryPersonels(id: ID): [DeliveryPersonel!]!,
    # Fetch all orders
		getOrders(id: ID): [Order]!,
    # Long Polling of Order Queue by Delivery Agent when available
		acceptOrderForDelivery(deliveryPersonelId: ID!): Order
	}
	type Mutation {
    # Add new Deliver Personel
		addDeliveryPersonel(
			name: String!,
			number: String!,
		): DeliveryPersonel,
    # Place a new order for cookies
		placeOrder(
			customerName: String!,
			customerNumber: String!,
			customerAddress: String!,
			quantity: Int!,
			lat: Float!,
			long: Float!
		): Order!,
    # Order deilvered by Delivery Personel, hence cleanup
		completeOrder(
			deliveryPersonelId: ID!,
			text: String!
		): Boolean!
	},
	type Subscription {
    // Subscription endpoint for customers to get live updates of their order
		orderTracking(
			orderId: ID!
		): Order!
	}
  ```
 
 3. Flow
      1. Add delivery personels to the system (addDeliveryPersonel)
      2 Order cookies from the store(placeOrder) and subscribe to order updates(orderTracking)
      3. Long polling by delivery personel client until order is available and delivery personel is free. ( Implemented on frontend for a static delivery personel currently with id: "5e654b57b1256b0017e6af57" on <a href="https://cookieman98.herokuapp.com/#/delivery">this</a> route)
      4. Orders are sent out on the basis of priority queue in which priority is decided on the basis of 2 parameters:
          * If orders arrived 10 mins apart each other then the order that came first should be served first else
          * The order closer to cookie shop (static (lat: latitude, long: longitude) => (19,19) => coordinates of the cookie shop)
      5. Notify the client about order that is sent out using publish subscriber model of apollo graphQL servers.
      6. Delivery perosnel scans the QR code that is given to customer and return the result to server for validation that cookie is delivered (verification of QR code to authenticate the presence of delivery personel on site).
      7. Client can enjoy cookies now!! And re-order them as well.
      8. Delivery Personel is now free and can again start long polling the server for new orders.
      
4. Why long polling and not cron job with subscriptions?
  <p>Instead of wasting computational time on guessing when the delivery personel will be available, we make the delivery personel ask for new orders whenever he/she is ready. Drawback is this increases unnecessary new traffic that could be many times useless</p>

### Who do I talk to? ###

* @NightWing1998 <a href="mailto:dsdruvil8@gmail.com">Mail</a> Phone No: +91 9969326535/ 8850392965
