const upload = require('express-fileupload')
const express = require('express');
const req = require('express/lib/request');
const path = require ('path');
var myApp = express();
const session = require('express-session');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/juiceshop', {
    UseNewUrlParser: true,
    UseUnifiedTopology: true
});

const Order = mongoose.model('order', {
    studentname : String, 
    studentid : String,
    mjuice : Number,
    bjuice : Number,
    ajuice : Number
})

const Admin = mongoose.model('Admin', {
    aname : String,
    pass : String
})

myApp.use(session({
    secret : "thisismyrandomkeysuperrandomsecret",
    resave : false,
    saveUninitialized : true
}))

const {check, validationResult} = require ('express-validator');
myApp.use(express.urlencoded({extended:true}));

myApp.set ('views', path.join(__dirname, 'views'));
myApp.use (express.static(__dirname + '/public'));
myApp.set ('view engine', 'ejs');
myApp.use(upload());

//------------------- Validation Functions --------------------
var nameRegex = /^(?!_)([A-Za-z ]+)$/;
var idRegex = /^[0-9]{7}$/;
var numRegex = /^\+?[1-9]\d*$/;

function checkRegex(userInput, regex) {
    if (regex.test(userInput))
        return true;
    else
        return false;
}
function customNameValidation(value) {
    if (!checkRegex(value, nameRegex)) {
        throw new Error('Please enter a correct name!');
    }
    return true;
}
function customIDValidation(value) {
    if (!checkRegex(value, idRegex)) {
        throw new Error('Please enter correct student id!');
    }
    return true;
}
function customNumValidation(value) {
    if (!checkRegex(value, numRegex)) {
        throw new Error('At least choose one item!');
    }
    return true;
}
myApp.get('/', function(req, res){
    res.render('form');
});

myApp.post('/', [
    check ('studentname', 'Student Name is required!').notEmpty(),
    check ('studentname','').custom(customNameValidation),
    check ('studentid', 'Student ID is required!').notEmpty(),
    check('studentid','').custom(customIDValidation),
    check('mjuice','bjuice','ajuice','').custom(customNumValidation)
],function(req, res){

    const errors = validationResult(req);
    console.log(errors);

    if (!errors.isEmpty())
    {
        res.render('form', {errors : errors.array()});
    }

    else 
    {
        var studentname = req.body.studentname;
        var studentid = req.body.studentid;
        var mjuice = req.body.mjuice;
        var bjuice = req.body.bjuice;
        var ajuice = req.body.ajuice;
        var subTotal = mjuice*6.99+bjuice*5.99+ajuice*3.99;
        
        var tax = subTotal*0.13;
        var totalCost = subTotal+tax;
        
        var pageData = {
            studentname : studentname, 
            studentid : studentid,
            mjuice : mjuice,
            bjuice : bjuice,
            ajuice : ajuice,
            subTotal : subTotal,
            tax : tax,
            totalCost : totalCost
        }

        var myOrder = new Order(pageData);
        myOrder.save().then(function () {
            console.log('New Order Created');
        })
        res.render('ordersuccess', pageData); 
    }
});

//All Orders Page
myApp.get('/allorders', (req,res)=>{
    if (req.session.userLoggedIn) { 
        Order.find({}).exec(function(err, orders) {
            console.log(err);
            res.render('allorders', {orders : orders});
        })
    }
    else { 
        res.redirect('/login');
    }
})

// Login Page
myApp.get('/login', (req,res) => {
    res.render('login');
})

myApp.post('/login', function (req,res) {
    var user = req.body.aname;
    var password = req.body.pass;

    Admin.findOne({aname : user, pass : password}).exec(function (err, admin) {
        console.log(`Error: ${err}`);
        console.log(`Admin: ${admin}`);

        if (admin) 
        {
            req.session.aname = admin.aname;
            req.session.userLoggedIn = true;
            res.redirect('/allorders');
        }
        else
        {
            res.render('login', {error : "Sorry Login Failed. Please try again!"});
        }
    })
})

//Logout Page
myApp.get('/logout', (req, res) => {
    req.session.username = '';
    req.session.userLoggedIn = false;
    res.render('login', {error : "Thank you for using the application! You are successfully logged out."});
})

//Delete Page
myApp.get('/delete/:id', (req,res) => { 
    if (req.session.userLoggedIn) {
        var id = req.params.id;
        console.log(id);
        Order.findByIdAndDelete({_id : id}).exec(function (err, order) {
            console.log(`Error: ${err}`);
            console.log(`Order: ${order}`);
            if (order) {
                res.render ('delete', {message : "Order Deleted Successfully!"});
            }
            else {
                res.render ('delete', {message : "Sorry, Order Not Deleted!"});
            }
        })
    }
    else {
        res.redirect('/login');
    }

})

myApp.listen(3062);
console.log('Everything executed fine... Open http://localhost:3062/');