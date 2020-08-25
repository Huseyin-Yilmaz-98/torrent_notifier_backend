module.exports.get_request_list = (req, res, dbinfo, knex) => {
    //create response
    const response = {
        success: false,
        status: "",
        requests: []
    }

    //if user id not in cookies, return error
    if (!req.session.user_id) {
        response.status = "not_signed_in";
        res.status(400).json(response);
        return;
    }

    //connect to database
    const db = knex(dbinfo);

    db("requests")
        .join("movies", "requests.mid", "movies.mid")
        .join("releases", "requests.rid", "releases.rid")
        .select("requests.mid", "releases.rname_eng", "releases.rname_tr", "movies.mname")
        .where("requests.uid", "=", req.session.user_id)
        .then(data => {
            const processed = [];
            data.forEach(entry => {
                if (processed.indexOf(entry.mid) === -1) {
                    response.requests.push({
                        mname: entry.mname,
                        mid: entry.mid,
                        releases_tr: data.filter((entry2) => entry.mid === entry2.mid).map((entry2) => entry2.rname_tr).join(", "),
                        releases_en: data.filter((entry2) => entry.mid === entry2.mid).map((entry2) => entry2.rname_eng).join(", ")
                    })
                    processed.push(entry.mid);
                }
            });
            response.status = "OK";
            response.success = true;
            res.json(response);
        })
        .catch(err => {
            console.log(err);
            response.status = "db_error";
            res.status(400).json(response);
        })
}