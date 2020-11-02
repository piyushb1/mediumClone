
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const articleRouter = require('./routes/articles')
const User = require('./models/user')
const Article = require("./models/article")
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: false
}));

// DB Config
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

//mongodb+srv://admin:n4tI7wwGSMOiQURw@cluster0.jorqq.mongodb.net/blog?retryWrites=true&w=majority

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected');
});


app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get("/", async function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", async function(req, res){
  
  const articles = await Article.find().sort({ createdAt:"desc" })
  res.render("articles/index", {articles:articles});
  

  });


app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res){

  User.register({username: req.body.username, name:req.body.name}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});



app.use('/articles', articleRouter)

app.listen (process.env.PORT || 3000, () => console.log("server is up and running successfully"))