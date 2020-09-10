const { login } = require("./login");
const { register } = require("./register");
const { movie_info } = require("./movie_info");
const { add_request } = require("./add_request");
const { forgot_password } = require("./forgot_password");
const { get_suggestions } = require("./get_suggestions");
const { password_reset_code_check } = require("./password_reset_code_check");
const { change_password } = require("./change_password");
const { logout } = require("./logout");
const { check_status } = require("./check_status");
const { get_request_list } = require("./get_request_list");
const { delete_request } = require("./delete_request");
const cors = require("cors");
const info = require("./info.json"); //json file that contains private info
const session = require("express-session");
const knex = require("knex");
const express = require("express");
const bcrypt = require("bcrypt-nodejs");
const useragent = require('express-useragent');
const app = express();
const MySQLStore = require('express-mysql-session')(session);

app.use(useragent.express()); //middleware that handles user-agent header

app.use(express.json()); //middleware that handles json body

app.use(cors({ credentials: true, origin: info["frontend-address"] })); //set cors address

const sessionStore = new MySQLStore(info["database-credentials"]); //create store for sessions

app.use(session({
    secret: info["session-secret"],
    cookie: { maxAge: 3600000 * 24 },
    resave: false,
    saveUninitialized: false,
    store: sessionStore
})); //create session manager

setInterval(() => sessionStore.clearExpiredSessions(), 3600000); //clear expired sessions once every hour

const dbinfo = {
    client: 'mysql',
    connection: info["database-credentials"],
    pool: { min: 0, max: 50 }
}; //define knex options

let db = knex(dbinfo); //create database connection

setInterval(() => {
    db
        .raw("select 1 as a")
        .catch(() => {
            db = knex(dbinfo);
            console.log("reconnected to database");
        });
}, 600000); //once every 5 minutes, check if the database connection is still active, if not, restore the connection


const isBot = (req, res, funcToCall) => { //each request goes through this function first, if it is not a bot, the request is handled
    if (req.useragent.isBot) {
        res.status(400).json({ success: false });
    }
    else {
        funcToCall();
    }
}


app.post("/login", (req, res) => isBot(req, res, () => login(req, res, db, bcrypt)));
app.post("/register", (req, res) => isBot(req, res, () => register(req, res, db, bcrypt)));
app.post("/movie_info", (req, res) => isBot(req, res, () => movie_info(req, res, db)));
app.post("/add_request", (req, res) => isBot(req, res, () => add_request(req, res, db)));
app.post("/forgot_password", (req, res) => isBot(req, res, () => forgot_password(req, res, db)));
app.post("/get_suggestions", (req, res) => isBot(req, res, () => get_suggestions(req, res)));
app.post("/password_reset_code_check", (req, res) => isBot(req, res, () => password_reset_code_check(req, res, db)));
app.post("/change_password", (req, res) => isBot(req, res, () => change_password(req, res, db, bcrypt)));
app.get("/logout", (req, res) => isBot(req, res, () => logout(req, res)));
app.get("/check_status", (req, res) => isBot(req, res, () => check_status(req, res, db)));
app.get("/get_request_list", (req, res) => isBot(req, res, () => get_request_list(req, res, db)));
app.post("/delete_request", (req, res) => isBot(req, res, () => delete_request(req, res, db)));


app.listen(info.port, () => console.log("app is running on "+info.port));