module.exports.password_reset_code_check = (req, res, db) => {
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

    const { email, code } = req.body;

    //check if email is string
    if (typeof email !== typeof "") {
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


    db.select("*")
        .from("users")
        .where("email", "=", email)
        .then(data => {
            if (data.length > 0) {
                db("pw_reset_requests")
                    .select("created_at")
                    .where("uid", "=", data[0].uid)
                    .andWhere("code", "=", code)
                    .then(data => {
                        if (data.length > 0) {
                            const created = new Date(data[0].created_at);
                            const diff = (Date.now() - created) / 3600000; //as hours
                            if (diff < 6) {
                                response.success = true;
                                response.status = "OK";
                                res.json(response);
                                
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