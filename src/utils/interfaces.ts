export interface User {
	name: string,
	number: string,
	history?: string[],
	id: string,
	currentOrders?: string[]
};

export interface Order {
	user: User,
	customerAddress: string,
	id: string,
	quantity: number,
	price: number,
	distance: number,
	barcodePath: string,
	status: string,
	arrivalTime: number,
	angle: number,
	deliveryPersonel?: User
}

export interface token {
	token: string
}