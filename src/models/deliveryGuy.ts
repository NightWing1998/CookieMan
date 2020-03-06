import { Schema, model } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

const DeliveryGuy: Schema = new Schema({
	name: {
		type: String,
		required: true
	},
	number: {
		type: String,
		minlength: 10,
		maxlength: 10,
		required: true,
		unique: true
	},
	history: [{
		type: Schema.Types.ObjectId,
		ref: "Order",
	}]
}).plugin(uniqueValidator);

export default model("delivery__personel", DeliveryGuy);