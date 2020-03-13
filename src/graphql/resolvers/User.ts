import order from "../../models/order";

export const UserResolver = () => ({
	currentOrders: async (parent: any, args: any, context: any): Promise<string[]> => {
		// console.log("@1", parent, "#1", context, "$1", args, parent.id === context.id);
		let { page } = args;
		if (page === undefined) {
			page = 0
		} else if (typeof page !== "number") {
			page = parseInt(page.toString() || '0');
		}
		if ((parent && parent.id && context && context.id && parent.id === context.id)) {
			if (context.category === "deliverypersonel" || args.category === "deliverypersonel") {
				return (await order.find({
					deliveryPersonel: parent.id, status: "assigned"
				})
					.skip(page * 10)
					.limit(10)
				)
					.map(oj => oj.toJSON().id);
			} else {
				return (await order.find({
					user: parent.id,
					status: {
						$in: ["assigned", "ordered"]
					}
				})
					.skip(page * 10)
					.limit(10)
				)
					.map(oj => oj.toJSON().id);
			}
		} else if (context.category === "admin") {
			if (parent.category === "deliverypersonel") {
				return (await order.find({
					deliveryPersonel: parent.id, status: "assigned"
				})
					.skip(page * 10)
					.limit(10)
				)
					.map(oj => oj.toJSON().id);
			} else {
				return (await order.find({
					user: parent.id,
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
		// console.log("@2", parent, "#2", context, "$2", args, parent.id === context.id);
		let { page } = args;
		if (page === undefined) {
			page = 0
		} else if (typeof page !== "number") {
			page = parseInt(page.toString() || '0');
		}
		if ((parent && parent.id && context && context.id && parent.id === context.id)) {
			if (context.category === "deliverypersonel") {
				return (await order.find({
					deliveryPersonel: parent.id,
				})
					.skip(page * 10)
					.limit(10)
				)
					.map(oj => oj.toJSON().id);
			} else {
				return (await order.find({
					user: parent.id,
				})
					.skip(page * 10)
					.limit(10)
				)
					.map(oj => oj.toJSON().id);
			}
		} else if (context.category === "admin") {
			console.log(parent);
			if (parent.category === "deliverypersonel") {
				return (await order.find({
					deliveryPersonel: parent.id,
				})
					.skip(page * 10)
					.limit(10)
				)
					.map(oj => oj.toJSON().id);
			} else {
				return (await order.find({
					user: parent.id,
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