var express = require('express');
var morgan = require('morgan'); //for showing routes status in console.
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var ejsMate = require('ejs-mate');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('express-flash');
var MongoStore = require('connect-mongo')(session);   
var passport= require('passport'); 

var secret = require('./config/secret');
var User = require('./models/user');
var Category = require('./models/category');

var cartLength = require('./middlewares/middleware');	

var app = express();

mongoose.Promise = global.Promise;
mongoose.connect(secret.database, function(err){
	if(err){
		console.log(err);
	}else{
		console.log("Connected to the database");
	}
});

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({
	resave: true,
	saveUninitialized: true,
	secret: secret.secretKey,
	store: new MongoStore({url: secret.database, autoReconnect:true}) //storing session in mongodb
}));
app.use(flash());
app.use(passport.initialize());	
app.use(passport.session());
app.use(function(req, res, next){ //making user accesible to every route so that we dont have to mention it in every route
	res.locals.user = req.user;
	next();
}); 

app.use(cartLength);
app.use(function(req, res, next){
	Category.find({}, function(err, categories){
		if(err) return next(err);
		res.locals.categories = categories;
		next();
	});
});

app.engine('ejs',ejsMate);
app.set('view engine', 'ejs');  

var mainRoutes = require('./routes/main');
var userRoutes = require('./routes/user');
var adminRoutes = require('./routes/admin');
var apiRoutes = require('./api/api');

app.use(mainRoutes);
app.use(userRoutes);
app.use(adminRoutes);	
app.use('/api', apiRoutes);

app.listen(secret.port, function(err){
	if(err) throw err; 
	console.log("Server is running at port " + secret.port);
});