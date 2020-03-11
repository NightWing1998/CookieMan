import { Schema, model, MongooseDocument } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

const CustomerSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: "User",
		unique: true
	},
	currentOrders: [{
		type: Schema.Types.ObjectId,
		ref: "Order"
	}],
	history: [{
		type: Schema.Types.ObjectId,
		ref: "Order",
	}]
}).plugin(uniqueValidator).set("toJSON", {
	transform: (doc: MongooseDocument, returnedDocument: MongooseDocument): void => {
		returnedDocument.id = doc._id.toString();
		delete returnedDocument._id;
	}
});;

export default model("Customer", CustomerSchema);