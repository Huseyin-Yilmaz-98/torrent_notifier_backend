//function to delete all password change requests for a user
const delete_request = (db, id) => {
    db("pw_reset_requests")
        .where("uid", "=", id)
        .del()
}

module.exports.change_password = (req, res, db, bcrypt) => {
    //create response
    const response = {
        success: false,
        status: ""
    }

    //if email or code is missing, return error
    if (!req.body.email || !req.body.code) {
        response.status = "missing_credential";
        res.status(400).json(response);
        return;
    }

    //if password is missing, return error
    if (!req.body.password) {
        response.status = "no_password_received";
        res.status(400).json(response);
    }

    //get email, code and new password from request body
    const { email, code, password } = req.body;

    //check if email is string
    if (typeof email !== typeof " ") {
        response.status = "email_no_string";
        res.status(400).json(response);
        return;
    }

    //check if code is string and if it meets the pattern
    if (typeof code !== typeof " " || !parseInt(code)) {
        response.status = "code_no_string_or_wrong_pattern";
        res.status(400).json(response);
        return;
    }

    //check if password is string
    if (typeof password !== typeof " ") {
        response.status = "password_no_string";
        res.status(400).json(response);
        return;
    }

    //check if password is 6 characters or more
    if (password.length < 6) {
        response.status = "password_too_short";
        res.status(400).json(response);
        return;
    }

    //convert password into hash
    const hash = bcrypt.hashSync(password);


    //check if email is in the database
    db.select("*")
        .from("users")
        .where("email", "=", email)
        .then(data => {
            if (data.length > 0) {
                //if email is in the database, get user id
                const id = data[0].uid;
                //get creation date for this request
                db("pw_reset_requests")
                    .select("created_at")
                    .where("uid", "=", id)
                    .andWhere("code", "=", code)
                    .then(data => {
                        if (data.length > 0) {
                            //if the request is found, check if it was created in the last 6 hours
                            const created = new Date(data[0].created_at);
                            const diff = (Date.now() - created) / 3600000; //as hours
                            if (diff < 6) {
                                //if everything matches, change the password
                                db("users")
                                    .where("email", "=", email)
                                    .update({ password_hash: hash })
                                    .then(() => {
                                        response.status = "OK";
                                        response.success = true;
                                        res.json(response);
                                        delete_request(db, id);
                                    })
                                    .catch(err => {
                                        console.log(err);
                                        response.status = "db_error";
                                        res.status(400).json(response);
                                    })
                            }
                            else {
                                response.status = "expired";
                                res.status(400).json(response);
                            }
                        }
                        else {
                            response.status = "request_not_found";
                            res.status(400).json(response);
                            
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        response.status = "db_error";
                        res.status(400).json(response);
                    })
            }
            else {
                response.status = "email_not_found";
                res.status(400).json(response);
            }
        })
        .catch(err => {
            console.log(err);
            response.status = "db_error";
            res.status(400).json(response);
        })
}