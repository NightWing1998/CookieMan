export interface User {
	name: string,
	number: string,
	history?: string[],
	id: string,
	currentOrders?: [string]
};

export interface Order {
	customerName: string,
	customerNumber: string,
	customerAddress: string,
	id: string,
	quantity: number,
	price: number,
	distance: number,
	barcodePath: string,
	status: string,
	relativeArrivalTime: number,
	deliveryPersonel?: User
}

export interface token {
	token: string
}