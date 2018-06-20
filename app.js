var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require("method-override");
var Cricketcamp = require("./models/cricketcamp");
var Comment = require("./models/comment");
var seedDB = require("./seeds");
var passport = require("passport");
var localStrategy = require("passport-local");
var User = require("./models/user");
var flash = require("connect-flash");
var app = express();
var cricketcampRoutes = require("./routes/cricketcamps.js");
var commentRoutes = require("./routes/comments.js");
var indexRoutes = require("./routes/index.js");
var passwordRoutes = require("./routes/password.js")

mongoose.connect("mongodb://localhost/MyAcademy");
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(require("express-session")({
    secret:"Jahnavi is very beautiful",
    resave: false,
    saveUninitialized:false
}));
app.use(methodOverride("_method"));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.locals.moment = require('moment');
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//seed the database
//seedDB();

app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.errorMessage = req.flash("error");
    res.locals.successMessage = req.flash("success");
    next();
});

app.use(cricketcampRoutes);
app.use(commentRoutes);
app.use(indexRoutes);
app.use(passwordRoutes);

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("myacademy server has started!!!");
});