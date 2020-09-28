module.exports.check_status = (req, res, db) => {
    const response = {
        signedIn: false,
        user: {}
    }

    if (!req.session.user_id) {
        res.json(response);
        return;
    }

    db.select("*")
        .from("users")
        .where("uid", "=", req.session.user_id)
        .then(data => {
            if (data.length > 0) {
                response.user = {
                    id: data[0].uid,
                    email: data[0].email,
                    joined_date: data[0].joined_date,
                    name: data[0].name
                };
                response.signedIn = true;
            }
            res.json(response);
        })
        .catch(err => {
            console.log(err);
            res.json(response);
            
        })
}