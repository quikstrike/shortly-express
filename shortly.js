var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var bcrypt = require('bcrypt-nodejs')

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


app.get('/',
function(req, res) {
  res.render('index');
});

app.get('/create',
function(req, res) {
  res.render('index');
});

app.get('/links',
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login',function(req,res){
  res.render('login');
})

app.post('/login',function(req,res){
  var userName = req.body.username
  var pass = req.body.password
  // console.log(userName +" "+password )
  //check if username and password match in the database
  //if it does, return a session id to store, or return an error

  var sessionID = db.knex('users') //set sessionID if authentication is successful
               .select('password')
               .where('username',userName)
               .then(function(password){  //callback after we grab the password
                 bcrypt.compare(pass,password[0].password,function(err,res){
                   if(res){
                     //create session ID, store in database, and tell client to store it localy
                     console.log("Password Matches")
                   }else{
                     //return username/password failed to authenticate
                     console.log("Password Does Not Match")
                   }
                 });
               })


  //run compare on the plaintext vs the hashed password

  bcrypt.compare(pass,hash,function(err,res){
    console.log(pass)
    console.log(hash)
    if(res){
      //create session ID, store in database, and tell client to store it localy
      console.log(pass)
      console.log(hash)
      console.log("Password Matches")
    }else{
      //return username/password failed to authenticate
      console.log("Password Does Not Match")
    }
  });
  //return session if true



  var authUser = new User({'username': userName, 'password' : pass}) //return boolean?



})

app.get('/signup',function(req,res){
  res.render('signup')
})

app.post('/signup',function(req,res){
  var userName = req.body.username
  var pass = req.body.password
  // console.log(userName +" "+password )
  //create new user with the provided username and password
  var nUser = new User({'username':userName,'password':pass});

  nUser.save().then(function(newUser){
    Users.add(newUser)
    res.send(201, "Created User Sucessfully")
  })
})

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
