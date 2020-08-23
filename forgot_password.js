const nodemailer = require('nodemailer');
const info = require("./info.json");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: info["email-username"],
        pass: info["email-password"]
    }
});


module.exports.forgot_password = (req, res, dbinfo, knex) => {

    //create response
    const response = {
        success: false,
        status: ""
    }

    //if email is missing, return error
    if (!req.body.email) {
        response.status = "missing_credential";
        res.status(400).json(response);
        return;
    }

    //get email from body
    const { email } = req.body;

    //check if email is string
    if (typeof email !== typeof "") {
        response.status = "email_no_string";
        res.status(400).json(response);
        return;
    }

    //connect to database
    const db = knex(dbinfo);

    //define a variable for user match
    let isUserFound = false;
    let user_id = null;

    db.select("*")
        .from("users")
        .where("email", "=", email)
        .then(data => {
            if (data.length > 0) {
                isUserFound = true;
                user_id = data[0].uid;
            }
            else {
                response.status = "invalid_credentials";
                res.status(400).json(response);
                db.destroy();
            }
        })
        .catch(err => {
            console.log(err);
            response.status = "db_error";
            res.status(400).json(response);
            db.destroy();
        })
        .then(() => {
            if (isUserFound && user_id !== null) {
                db("password_reset_requests")
                    .where("uid", "=", user_id)
                    .del()
                    .catch(err=>console.log("couldnt delete"))
                    .finally(() => {
                        const randomCode = Math.floor(100000 + Math.random() * 900000);
                        db.insert({
                            code: randomCode,
                            uid: user_id,
                            created_at: new Date()
                        })
                            .into("password_reset_requests")
                            .returning("prr_id")
                            .then(() => {
                                const url=new URL("/reset_password", info["frontend-address"]);
                                url.searchParams.append("email",email);
                                url.searchParams.append("code",randomCode.toString());
                                const mailOptions = {
                                    from: info["email-username"],
                                    to: email,
                                    subject: 'Forgot Password',
                                    text: url.href
                                };
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        console.log(error);
                                        response.status = "mail_not_sent";
                                        res.status(400).json(response);
                                        db.destroy();
                                    } else {
                                        console.log("Sent " + info.response);
                                        response.status = "OK";
                                        response.success = true;
                                        res.json(response);
                                        db.destroy();
                                    }
                                });
                            })
                    })
            }
        })
}