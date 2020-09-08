module.exports.delete_request = (req, res, db) => {

    //create response
    const response = {
        success: false,
        status: "OK",
        requests: []
    }

    //if user id not in cookies, return error
    if (!req.session.user_id) {
        response.status = "not_signed_in";
        res.status(400).json(response);
        return;
    }

    //if movie_id is missing, return error
    if (!req.body.movie_id) {
        response.status = "movie_id_missing";
        res.status(400).json(response);
        return;
    }

    //get movie_id from body
    const { movie_id } = req.body;



    db("requests")
        .where("uid", "=", req.session.user_id)
        .andWhere("tid", "=", movie_id)
        .andWhere("season", "=", req.body.season || -1)
        .andWhere("episode", "=", req.body.episode || -1)
        .del()
        .then(() => {
            db("requests")
                .join("titles", "requests.tid", "titles.tid")
                .join("versions", "requests.vid", "versions.vid")
                .select("requests.tid", "versions.name_en", "versions.name_tr", "titles.name", "titles.year", "requests.season", "requests.episode")
                .where("requests.uid", "=", req.session.user_id)
                .orderBy("requests.added_date", "asc")
                .then(data => {
                    const processed = [];
                    data.forEach(entry => {
                        const stringToCheck = entry.tid + " " + entry.season + " " + entry.episode
                        if (processed.indexOf(stringToCheck) === -1) {
                            response.requests.push({
                                name: entry.name + (entry.year === "0000" ? "" : (" (" + entry.year + ")")),
                                tid: entry.tid,
                                versions_tr: data.filter((entry2) => [entry.tid, entry.season, entry.episode].toString() === [entry2.tid, entry2.season, entry2.episode].toString()).map((entry2) => entry2.name_tr).join(", "),
                                versions_en: data.filter((entry2) => [entry.tid, entry.season, entry.episode].toString() === [entry2.tid, entry2.season, entry2.episode].toString()).map((entry2) => entry2.name_en).join(", "),
                                season: entry.season,
                                episode: entry.episode
                            })
                            processed.push(stringToCheck);
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
        })
        .catch(err => {
            console.log(err);
            response.status = "db_error";
            res.status(400).json(response);
        })
}