const { get_suggestions } = require("./get_suggestions")

module.exports.logout = (req, res) => {
    req.session.user_id=undefined;
    res.json("OK");
}