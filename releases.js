module.exports.releases = (req, res, dbinfo, knex) => {
    const db = knex(dbinfo);
    const response = { success: false, data: [] }
    db.select("*")
        .from("releases")
        .then(data => {
            response.success = true;
            response.data = data;
            res.json(response);
        })
        .catch(err => {
            console.log(err);
            res.status(400).json(response);
        })
}