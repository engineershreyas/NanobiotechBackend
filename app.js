var express = require('express');
var mongodb = require('mongodb');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');

var app = express();
var mongouri = 'mongodb://shreyashirday:nanobiotech@ds043714.mongolab.com:43714/heroku_pzzfjzvl'

var MongoClient = mongodb.MongoClient;

var port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.use( bodyParser.json() );

app.get('/', function(req,res){
  res.send("hello, world!");
});

app.post('/register', function(req,res){

  var un = req.body.username;
  var password = req.body.password;
  var em = req.body.email;

  if(un === undefined || password === undefined || em === undefined){

    var erro = {
      code : 8,
      status : "error",
      message_technical : "username and password not provided",
      message_user : "Login failed, please try again!",
      date : new Date()
    };

    res.status(400).send(JSON.stringify(erro));

  }
  else{


  var response = '';

  bcrypt.hash(password,null,null, function(err, hash){

    if(err){
      console.log("password hash failed");
      var erro = {
        code : 1,
        status : "error",
        message_technical : "password hash failed",
        message_user : "Registration failed, please try again!",
        date : new Date()
      };
      res.status(400).send(JSON.stringify(erro));
    }
    else{



    MongoClient.connect(mongouri, function(err, db){

      if(err){
        console.log("error connecting to database");
        var erro = {
          code : 2,
          status : "error",
          message_technical : "error connecting to database",
          message_user : "Registration failed, please try again!",
          date : new Date()
        };
        res.status(400).send(JSON.stringify(erro));
      }
      else{
        console.log("registration of user: " + un + " succeeded");

          var collection = db.collection("users");



          collection.count( {username : un }, function(err, count) {
          console.log("count = " + count);


          if(count != 0 && count !== undefined){

            console.log("User exists");
            var erro = {
              code : 4,
              status : "error",
              message_technical : "username already exists",
              message_user : "Username already exists, please choose another one!",
              date : new Date()
            };

            res.status(400).send(JSON.stringify(erro));

          }
          else{
            var user = {username : un, email : em, password : hash };

            collection.insert(user, function(err, result){
              if(err){
                console.log("error inserting user into db = " + err);
                var erro = {
                  code : 3,
                  status : "error",
                  message_technical : "error inserting user into db",
                  message_user : "Registration failed, please try again!",
                  date : new Date()
                };

                res.status(400).send(JSON.stringify(erro));

              }
              else{
                var success = {
                  code : 0,
                  status : "ok",
                  message_technical : "",
                  message_user : "Registration successful!",
                  date : new Date()


                }

                res.status(200).send(JSON.stringify(success));

              }


              db.close();

            });
          }

        });









      }

    });

  }

  });


}


});

app.post('/login', function(req,res){

  var un = req.body.username;
  var password = req.body.password;

  if(un === undefined || password === undefined){
    var erro = {
      code : 8,
      status : "error",
      message_technical : "username and password not provided",
      message_user : "Login failed, please try again!",
      date : new Date()
    };

    res.status(400).send(JSON.stringify(erro));

  }
  else{

  MongoClient.connect(mongouri, function(err, db){

    if(err){
      console.log("error connecting to database");
      var erro = {
        code : 2,
        status : "error",
        message_technical : "error connecting to database",
        message_user : "Login failed, please try again!",
        date : new Date()
      };
      res.status(400).send(JSON.stringify(erro));
    }
    else{
      var collection = db.collection("users");

      var cursor = collection.find( {"username" : un })
      var count = cursor.count();

      if(count == 0){
        var erro = {
          code : 5,
          status : "error",
          message_technical : "username does not exist",
          message_user : "Login failed, please try again!",
          date : new Date()
        };
        res.status(400).send(JSON.stringify(erro));
      }
      else{
        cursor.each(function(err,doc){
            if(doc != null){
              var pass = doc["password"];
              bcrypt.compare(password,pass,function(err, result){
                if(err){
                  var erro = {
                    code : 6,
                    status : "error",
                    message_technical : "failed comparing hashes",
                    message_user : "Login failed, please try again!",
                    date : new Date()
                  };
                }
                else{
                  if(result === true){

                    var erro = {
                      code : 0,
                      status : "ok",
                      message_technical : "",
                      message_user : "Login success!",
                      date : new Date()
                    };

                    res.status(200).send(JSON.stringify(erro));
                  }
                  else{
                    var erro = {
                      code : 7,
                      status : "error",
                      message_technical : "password did not match",
                      message_user : "Login failed, please try again!",
                      date : new Date()
                    };
                    res.status(400).send(JSON.stringify(erro));
                  }
                }
              });
            }
        });
      }

    }


  });


}

});

app.post('/registerDevice',function(req,res){


  var token = req.body.deviceToken;
  var deviceId = req.body.deviceId;
  var firmwareVersion = req.body.firmwareVersion;
  var un = req.body.username;
  var m = req.body.model;

  var cloudToken = '';

  if(token === cloudToken){

    MongoClient.connect(mongouri, function(err, db){

      if(err){
        console.log("error connecting to database");
        var erro = {
          code : 2,
          status : "error",
          message_technical : "error connecting to database",
          message_user : "Device registeration failed, please try again",
          date : new Date()
        };
        res.status(400).send(JSON.stringify(erro));
      }
      else{
        var collection = db.collection("users");

        var cursor = collection.find({username : un });

        cursor.each(function(err,doc){

          if(doc != null){
            var id = doc["_id"];
            var idString = id.valueOf();

            var devices = db.collection("devices");

            var d = new Date();

            var device = {userID : idString, deviceID : deviceId, firmware : firmwareVersion, model : m, registeredAt : d};

            devices.insert(device, function(err, result){

              if(err){
                var erro = {
                  code : 10,
                  status : "error",
                  message_technical : "error inserting device into database",
                  message_user : "Device registeration failed, please try again",
                  date : new Date()
                };
                res.status(400).send(JSON.stringify(erro));
              }
              else{
                var success = {
                  code : 0,
                  status : "ok",
                  message_technical : "".
                  message_user : "Device registration succeeded!",
                  date : new Date()
                };
                res.status(200).send(JSON.stringify(success));
              }


            });


          }

        });

      }


    });

  }
  else{
    var erro = {
      code : 9,
      status : "error",
      message_technical : "invalid token",
      message_user : "Device registeration failed, please try again",
      date : new Date()
    };

    res.status(400).send(JSON.stringify(erro));
  }



});


app.listen(port, function() {
  console.log("listening");
});
