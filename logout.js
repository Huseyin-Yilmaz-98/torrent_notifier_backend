const { get_suggestions } = require("./get_suggestions")

module.exports.logout = (req, res) => {
    req.session.destroy();
    res.json("OK");
}