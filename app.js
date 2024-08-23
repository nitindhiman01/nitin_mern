//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cookieParser());

mongoose.connect("mongodb://127.0.0.1:27017/temporaryDB");


const userSchema = new mongoose.Schema({
  name : String,
  email: String,
  password: String
});

const infoSchema = new mongoose.Schema({
    name : String,
    email: String
  });

const User = new mongoose.model("User", userSchema);
const Info = new mongoose.model("Info", infoSchema);

const isAuthenticatedUser = async (req, res, next) => {
    // const authHeader = req.headers['authorization'];
    // const token = authHeader && authHeader.split(' ')[1];
    const {token} = req.cookies;

    console.log(token);

    if(!token){
        res.status(301).json({
            success: false,
            message: "unauthorized user"
        });
    }

    const decodedData = jwt.verify(token, "JKDBAJDFKASDFHLASJDKSADFJBLIAUDGSBKJAKDSJB");

    req.user = await User.findById(decodedData.id);

    next();
}

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/info", isAuthenticatedUser, function(req, res){
    res.render("info");
});

app.post("/login", async function(req, res){
   const {email, password} = req.body;

   const user = await User.findOne({email}).select("+password");

   if(!user || user.password !== password){
    console.log("no user exist");
    return res.status(401).json({
        success: false,
    });
   }

   const token = jwt.sign({id: user._id, email: user.email}, "JKDBAJDFKASDFHLASJDKSADFJBLIAUDGSBKJAKDSJB", {
    expiresIn: "1d",
   });


    // res.status(200).send({ token });
    res.redirect("/info");
    
    
  });

app.post("/info", async function(req, res){

    const info = await Info.create(req.body);

    res.redirect("/alluser");

});

app.get("/updateuser/:id", isAuthenticatedUser, async function(req, res){
    await Info.findById(req.params.id).then((userinfo) => {
        res.render("update", {userinfo: userinfo});
    });
})

app.get("/alluser", isAuthenticatedUser, async function(req, res){
    await Info.find({}).then((userinfo) => {
        res.render("alluser", {userinfo: userinfo});
    });
});

app.put("/updateuser/:id", isAuthenticatedUser, async function(req, res){

    await Info.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        useFindAndModify: true
    });

    res.redirect("/alluser")
});

app.delete("/deleteuser/:id", isAuthenticatedUser, async function(req, res){
    let info = await Info.findById(req.params.id);

    if(!info){
        res.status(301).json({
            success: false
        });
    }

    info = await Info.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: "deleted"
    });
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
