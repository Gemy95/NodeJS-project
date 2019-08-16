var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser = require('body-parser');
var socket = require('socket.io');
const multer=require('multer');
const ejs=require('ejs');
const path=require('path');
var fs = require("fs");

app.use(cors({origin: "*"}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});



var server = require('http').createServer(app);
var io = socket.listen(server);

  

////////////////////////////////////////image//////////////////////////////////////////////////
const storage=multer.diskStorage({
    destination :'./public/uploads/' ,
    filename : function (req,file,cb){
      cb(null,file.fieldname+'-'+Date.now()+'.jpg');
      path.extname(file.originalname);
    }
});

const upload= multer({
    storage:storage
   // ,limits:{fileSize:1000000}
    ,fileFilter :function (req,file,cb)
    {
        checkFileType(file,cb);
    }
}).single('imgUrl');

function checkFileType(file,cb)
{
    const filetypes=/jpeg|jpg|png|gif/;
    const extname=filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype =filetypes.test(file.mimetype);

    if(extname && mimetype)
    {
        return cb(null,true);
    }
    else
    {
     cb(' error: Images Only ');
    }
}


app.set('view engine' , 'ejs');
app.get('/add',(req,res)=>res.render('AddProduct'));
app.use(express.static('./public'));


app.post('/insert',function(req,res){

    upload (req,res,(err)=>{
        if(err){
            //res.render('/',{msg:err});
            res.render('errorInsert');
        }
        else
        {

            //console.log(req.file.path);
            //console.log(req.body);
            let data =req.body;
            let imgName=req.file.filename; 
            data.imgUrl= imgName;
            let newPrd= JSON.stringify(data);
            //newPrd.imgUrl = req.file.path ; 
            //console.log(data);
            //console.log(typeof data);
            productController.insertProduct(newPrd)
                .then((dataaa) => {
                    console.log("Inserted")
                    res.redirect('/index');
            }) .catch(err => res.status(400).json({}));

            

        }
    })

});


/////////////////////////////////////////passport//////////////////////////////////////////////////


app.get('/success', (req, res) => res.send("Welcome "+req.query.username+"!!"));
app.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  User.findById(id, function(err, user) {
    cb(err, user);
  });
});

////////////////////////////////////////////////////////////////////////////////////////////

var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'secret';
opts.issuer = 'accounts.examplesoft.com';
opts.audience = 'yoursite.net';
passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    User.findOne({id: jwt_payload.sub}, function(err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
            // or you could create a new account
        }
    });
}));

////////////////////////////////////////////////////////////////////////////////////////////

/* MONGOOSE SETUP */

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/MyDatabase');

const Schema = mongoose.Schema;
const UserDetail = new Schema({
      username: String,
      password: String
    });
const UserDetails = mongoose.model('userInfo', UserDetail, 'userInfo');


////////////////////////////////////////////////////////////////////////////////////////////

/* PASSPORT LOCAL AUTHENTICATION */

const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
      UserDetails.findOne({
        username: username
      }, function(err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false);
        }

        if (user.password != password) {
          return done(null, false);
        }
        return done(null, user);
      });
  }
));



////////////////////////////////////////////////////////////////////////////////////////



var productControllerClass = require("./controller");
var productController = new productControllerClass();


var clientCount=0;

var products=[{name:"p1",quantity:10,price:20},{name:"p2",quantity:5,price:20}];

io.on('connection', function(client) {
	console.log('Client connected...\nNumber of connected clients:' + ++clientCount);
    
    productController.getAllProducts()
    .then((data) => {
        //res.send(JSON.stringify(data));
        client.emit("message_from_server",{msg:data});
    }) .catch(err => res.status(400).json({}));

      client.on("message_from_client", function(data){
      		console.log("message Event from client " );
    });


    client.on("client buy", function(product){
        console.log("message Event from client buy " +product.msg );
       // console.log(product.msg);
        productController.getProduct(product.msg)
        .then((data) => {
            var quantity_of_product=data[0].quantity-1;
            if(quantity_of_product==0)
            {
                productController.removeProduct(product.msg).then((ddd)=>{})
                .catch(err => res.status(400).json({}));
                console.log('yes removed');
            }
            else
            {
               productController.updateProductQuantity(product.msg, quantity_of_product).then((dd)={})
               .catch(err => res.status(400).json({}));
            }
            
            io.sockets.emit("server replay on buy",{name:product.msg,quantity:quantity_of_product}); 
        }) .catch(err => res.status(400).json({}));
    });

 
}); 

/////////////////////////////////////////////////////auth//////////////////////




app.get('/', (req, res) => res.sendFile('auth.html', { root : __dirname}));

/*
app.all('/*', function(req , res , next) {
   res.sendFile('auth.html', { root : __dirname});
   next();
});
*/


app.post('/',
  passport.authenticate('local', { failureRedirect: '/error' }),
  function(req, res) {
     res.redirect('/index');
  });



  
  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

////////////////////////////////////////////////////////////////////////////



app.get('/getShow',function(req,res){

     res.render('showDetails');

})




app.get('/index',function(req,res)
{
  console.log("from index route");
    res.sendFile(__dirname+"/"+"IndexDB.html");
});


app.get("/getProducts",function(reg,res){
    
    productController.getAllProducts()
        .then((data) => {
            res.send(JSON.stringify(data));
        }) .catch(err => res.status(400).json({}));
});



app.get("/delete/:name",function(req,res){
    console.log('delete');
    productController.removeProduct(req.params.name)
    .then((data) => {
    }).catch(err => res.status(400).json({}));

    res.redirect('/index');
});


app.get("/show/:name",function(req,res){
    productController.getProduct(req.params.name)
        .then((data) => {
           var obj=
           {
           "name" : data[0].name,   
           "color" :data[0].color, 
           "price" : data[0].price, 
           "model" : data[0].model, 
           "brand" : data[0].brand,
           "details" :data[0].details, 
           "quantity" :data[0].quantity,
           "weight" :data[0].weight, 
           "imgUrl" : data[0].imgUrl 
           }

           res.render('showDetails', {data: obj}); 

        
        }) .catch(err => res.status(400).json({}));
});

;



app.get('/edit/:name', function (req, res) {
    
    productController.getProduct(req.params.name)
        .then((data) => {
           // console.log(data);
            var html=`
            <!DOCTYPE html> 
            <head>
                <title>example edit product</title>
                <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">	  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
  
            </head>
            <body>
            <div class='container'>
            <h3>Edit Product </h3>
               <form action="http://localhost:5000/update/${req.params.name}" method="post">         
                      <div class="form-group">
                         <label><b>Name</b></label>
                         <input class="form-control" type="text" name="name" value="${req.params.name}" readonly />
                      </div>
                      <div class="form-group">
                         <label><b>Color</b></label>
                         <input class="form-control" type="text" name="color"  value='${data[0].color}' required />
                      </div>  
                      <div class="form-group">
                         <label><b>Price</b></label>
                         <input class="form-control" type="text" name="price"  value='${data[0].price}' required />
                      </div> 
                      <div class="form-group"> 
                         <label><b>Model</b></label>
                         <input class="form-control" type="text" name="model"  value='${data[0].model}' required />
                       </div>
                       <div class="form-group">
                         <label><b>Brand</b></label>
                         <input class="form-control" type="text" name="brand"  value='${data[0].brand}' required />
                        </div>
                        <div class="form-group">
                         <label><b>Details</b></label>
                         <input class="form-control" type="text" name="details"  value='${data[0].details}' required />
                        </div>
                        <div class="form-group">
                         <label><b>weight</b></label>
                         <input class="form-control" type="text" name="weight"  value='${data[0].weight}' required />
                        </div>
                        <div class="form-group">
                         <label><b>Quantity</b></label>
                         <input class="form-control" type="text" name="quantity"  value='${data[0].quantity}' required />
                        </div>
                        <div class="form-group">
                         <input class='btn btn-danger' type="submit" value="send" />
                    </form>
                </div>
            </body>
            </html>
       `;
            res.send(html);
        }) .catch(err => res.status(400).json({}));
    })



    app.post('/update/:name', function (req, res) {
    //  console.log(req.body);
        let editPrd= JSON.stringify(req.body);
     
        productController.updateProduct(editPrd)
        .then((data) => {
        }) .catch(err => res.status(400).json({}));

       res.redirect("/index");
      })



      app.get("/buy/:name",function(req,res){

        productController.getProduct(req.params.name)
            .then((data) => {
                var quantity_of_product=data[0].quantity-1;
                if(quantity_of_product==0)
                {
                    productController.removeProduct(req.params.name)
                    .then((data) => {
                    }) .catch(err => res.status(400).json({}));
                }
                else
                {
                productController.updateProductQuantity(req.params.name, quantity_of_product)
                .then((data) => {
                }) .catch(err => res.status(400).json({}));
                } 
                res.redirect("/index");

            }) .catch(err => res.status(400).json({}));
            
    });

    ////////////////////////////Angular/////////////////////////////////////////////////////////////


    app.get("/buyAngular/:name/:quantity",function(req,res){

         console.log("quantity="+req.params.quantity);
         console.log("name="+req.params.name);
      productController.getProduct(req.params.name)
          .then((data) => {
            console.log("product="+data[0].quantity);
               var quantity_of_product=data[0].quantity-parseInt(req.params.quantity);
             
              productController.updateProductQuantity(req.params.name, quantity_of_product)
              .then((data) => { 
                console.log("data="+data);
                res.send(JSON.stringify(data));
              }) .catch(err => res.status(400).json({}));
              //} 


          }) .catch(err => res.status(400).json({}));
          
  });


  app.get("/showAngular/:name",function(req,res){
    
    productController.getProduct(req.params.name)
        .then((data) => {
            res.send(JSON.stringify(data));
        }) .catch(err => res.status(400).json({}));
  });
  
  app.get("/deleteAngular/:name",function(req,res){
    console.log('delete');
    
    productController.removeProduct(req.params.name) .then((data) => { 
      console.log("data="+data);
      res.send(JSON.stringify(data));
    }) .catch(err => res.status(400).json({}));

  })

  app.post('/updateAngular/:name', function (req, res) {
    //console.log(req.params.name);
    //console.log(req.body);
    let editPrd= JSON.stringify(req.body); 
    //console.log(editPrd);
    productController.updateProduct(editPrd)
    .then((data) => { 
      console.log("data="+data);
      res.send(JSON.stringify(data));
    }) .catch(err => res.status(400).json({}));

  })


    ////////////////////////////////////////////////////////////////////////////////////


    app.post('/insertAngular',function(req,res){

      upload (req,res,(err)=>{
          if(err){
            console.log("error in uploading image");
          }
          else
          {
  
              console.log(req.file);
              console.log("request = "+req);
              let data =req.body;
              //let imgName=req.file.filename; 
              //data.imgUrl= imgName;
              let newPrd= JSON.stringify(data);
              //newPrd.imgUrl = req.file.path ; 
              console.log(newPrd);
              //console.log(typeof data);
              productController.insertProduct(newPrd)
                  .then((data) => {
                    console.log("data="+data);
                    res.send(JSON.stringify(data));
              }) .catch(err => res.status(400).json({}));
              
  
          }
      })
  
  });






    /////////////////////////////////////////////////////////////////////////////////////


 
server.listen(5000, function () {
    console.log("Server listening...");
});
  