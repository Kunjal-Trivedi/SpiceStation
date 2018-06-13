var router = require('express').Router();
var User = require('../models/user');
var Product = require('../models/product');
var Cart = require('../models/cart');	

function paginate(req, res ,next){
	var perPage = 9;
	var page = req.params.page;

	Product.find().skip(perPage * page)	//9 * pageNo 9*2 skip 18 documents
	.limit(perPage)
	.populate('category')
	.exec(function(err, products){
		Product.count().exec(function(err, count){
			if(err) return next(err);
			res.render('main/product-main', {	//not rendering all the data at once
				products:  products,
				pages: count/perPage	// no. pages to show in pagination toal/9
			});
		});
	}); 
}

Product.createMapping(function(err, mapping){
	if(err){
		console.log("error creating mapping");
		console.log(err);
	}else{
		console.log("Mapping created");
		console.log(mapping);
	}
});

var stream = Product.synchronize();
var count = 0;
stream.on('data', function(){
	count++;
});
 
stream.on('close', function(){
	console.log("Indexed " + count + " documents");
});
stream.on('error', function(err){
	console.log(err);
});
	
router.get('/cart', function(req, res, next){
	Cart.findOne({ owner: req.user._id })
	.populate('items.item')
	.exec(function(err, foundCart){
		if (err) return next(err);
		res.render('main/cart', {
			foundCart: foundCart,
			message: req.flash('remove')
		}); 
	});
});

router.post('/charge',function(req,res){
	var token = req.body.stripeToken;
	var charge=req.body.chargeAmount;
	var charge=stripe.charges.create({
		//amount:chargeAmount,
		currency:"usd",
		source:token
	},function(err,charge){
		if(err & err.type === "stripeCardError"){
			console.log("card declined");
		}

	})
	console.log("payment sucess")
	//res.redirect
});

router.post('/remove', function(req, res, next){
	Cart.findOne({ owner: req.user._id}, function(err, foundCart){
		foundCart.items.pull(String(req.body.item));
		foundCart.total = (foundCart.total - parseFloat(req.body.price)).toFixed(2);
		foundCart.save(function(err, found){
			req.flash('remove', 'Successfully Removed!');
			res.redirect('/cart');
		});
	});
});

router.post('/product/:product_id', function(req, res, next){
	Cart.findOne({ owner: req.user._id }, function(err, cart){
		cart.items.push({
			item: req.body.product_id,
			//item_id: req.body.product_id,
			price: parseFloat(req.body.priceValue),
			quantity: parseInt(req.body.quantity),
			//name: req.body.nameHidden,
			//image: req.body.imageHidden
		});
		cart.total = (cart.total + parseFloat(req.body.priceValue)).toFixed(2);
		cart.save(function(err){
			if(err) return next(err);		
			return res.redirect('/cart');
		});
	});
});

router.get('/search', function(req, res, next){
	if(req.query.q){
		Product.search({
			query_string: { query: req.query.q}
		}, function(err, result){
			if(err) return next(err);
			var data = result.hits.hits.map(function(hit){
				return hit;
			});
			res.render('main/search-result', {
				query: req.query.j,
				data: data
			});
		});
	}
});

router.post('/search', function(req, res, next){
	res.redirect('/search?q='+req.body.q);
})

router.get('/', function(req, res, next){

	if(req.user){
		paginate(req, res, next);
	}else{
		res.render('main/home');
	}
});

router.get('/page/:page', function(req, res, next){
	paginate(req, res, next);
});

router.get('/about', function(req, res){
	res.render('main/about');
});

router.get('/products/:id', function(req, res, next){
	Product.find({ category: req.params.id  })
	.populate('category')
	.exec(function(err, products){
		if(err) return next(err);
		res.render('main/category', {
			products: products
		});
	});  
});

router.get('/product/:id', function(req, res, next){
	Product.findById({_id: req.params.id}, function(err, product){
		if(err) return next(err)
		res.render('main/product', {
			product: product
		});
	});
}); 

module.exports = router;