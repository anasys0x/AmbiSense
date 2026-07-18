const deviceAuth = require('./auth');
const userAuth = require('./userAuth');

function observationAuth(req, res, next) {
    if (req.header('Authorization')) {
        return userAuth(req, res, next);
    }
    return deviceAuth(req, res, next);
}

module.exports = observationAuth;
