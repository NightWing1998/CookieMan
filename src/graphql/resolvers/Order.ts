export const OrderResolver = () => ({
	eta: (parent: any): string | null => {
		if (parent.eta) {
			return parent.eta.toLocaleString()
		} else {
			return null;
		}
	}
});

export default OrderResolver;