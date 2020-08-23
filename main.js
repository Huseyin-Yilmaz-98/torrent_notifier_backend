const express = require("express");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");
const { json } = require("express");
const { releases } = require("./releases");
const { login } = require("./login");
const { register } = require("./register");
const { movie_info } = require("./movie_info");
const { add_request } = require("./add_request");
const { forgot_password } = require("./forgot_password");
const { get_suggestions } = require("./get_suggestions");
const { password_reset_code_check } = require("./password_reset_code_check");
const { change_password } = require("./change_password");
const session = require("express-session");
const { logout } = require("./logout");
const { check_status } = require("./check_status");
const info = require("./info.json");
const app = express();

app.use(express.json());

app.use(cors({ credentials: true, origin: info["cors-origin"] }));

app.use(session({
    secret: info["session-secret"],
    cookie: { maxAge: 3600000 * 24 },
    resave: false,
    saveUninitialized: true
}));

const dbinfo = {
    client: 'pg',
    connection: info["database-credentials"]
}



app.get("/releases", (req, res) => releases(req, res, dbinfo, knex));
app.post("/login", (req, res) => login(req, res, dbinfo, knex, bcrypt));
app.post("/register", (req, res) => register(req, res, dbinfo, knex, bcrypt));
app.post("/movie_info", (req, res) => movie_info(req, res, dbinfo, knex));
app.post("/add_request", (req, res) => add_request(req, res, dbinfo, knex));
app.post("/forgot_password", (req, res) => forgot_password(req, res, dbinfo, knex));
app.post("/get_suggestions", (req, res) => get_suggestions(req, res));
app.post("/password_reset_code_check", (req, res) => password_reset_code_check(req, res, dbinfo, knex));
app.post("/change_password", (req, res) => change_password(req, res, dbinfo, knex, bcrypt));
app.get("/logout", (req, res) => logout(req, res));
app.get("/check_status", (req, res) => check_status(req, res, dbinfo, knex));


app.listen(3333, () => console.log("app is running"));