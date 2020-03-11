import order from "../../models/order";

export const UserResolver = () => ({
	currentOrders: async (parent: any, args: any, context: any, info: any): Promise<string[]> => {
		// console.log("@1", parent, "#1", context, "$1", args);
		let { page } = args;
		if (page === undefined) {
			page = 0
		} else if (typeof page !== "number") {
			page = parseInt(page || '0');
		}
		if ((parent && parent.id && context && context.id && parent.id === context.id) || context.category === "admin") {
			if (context.category === "deliverypersonel" || args.category === "deliverypersonel") {
				return (await order.find({
					deliveryPersonel: parent.id, status: "asigned"
				})
					.skip(page * 10)
					.limit(10)
				)
					.map(oj => oj.toJSON().id);
			} else {
				return (await order.find({
					userId: parent.id,
					status: {
						$in: ["assigned", "ordered"]
					}
				})
					.skip(page * 10)
					.limit(10)
				)
					.map(oj => oj.toJSON().id);
			}
		} else {
			return [];
		}
	},
	history: async (parent: any, args: any, context: any): Promise<string[]> => {
		// console.log("@2", parent, "#2", context, "$2", args);
		let { page } = args;
		if (page === undefined) {
			page = 0
		} else if (typeof page !== "number") {
			page = parseInt(page || '0');
		}
		if ((parent && parent.id && context && context.id && parent.id === context.id) || context.category === "admin") {
			if (context.category === "deliverypersonel" || args.category === "deliverypersonel") {
				return (await order.find({
					deliveryPersonel: parent.id,
					status: "delivered"
				})
					.skip(page * 10)
					.limit(10)
				)
					.map(oj => oj.toJSON().id);
			} else {
				return (await order.find({
					userId: parent.id,
					status: "delivered"
				})
					.skip(page * 10)
					.limit(10)
				)
					.map(oj => oj.toJSON().id);
			}
		} else {
			return [];
		}
	}
})

export default UserResolver;