var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CartSchema = new Schema({
	owner: {type: Schema.Types.ObjectId, ref: 'User'},
	total: {type: Number, default: 0},
	items: [{
		item: {type: Schema.Types.ObjectId, ref: 'Product'},
		quantity: {type: Number, default: 1},
		price: {type: Number, default: 0}
		/*item_id: {type: String},
		image: {type: String},
		name: {type: String}*/
	}]
});

module.exports = mongoose.model('Cart', CartSchema);	 	