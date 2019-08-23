const jwt = require('./jwt.helper');
const Admin = require('../models/admin.model');
const { responseOk, responseError } = require('../helpers/paginate.helper');

module.exports.mustBeAdmin = (req, res, next) => {
    const token = req.get('access_token_admin');
    if (!token)
        return responseError(res, 403, 'TOKEN_INVALID');

    return jwt.verify(token)
        .then(obj => {
            if (!obj || !obj._id)
                return responseError(res, 403, 'TOKEN_INVALID');

            const { _id } = obj;
            return Admin.findById(_id);
        })
        .then(admin => {
            if (!admin)
                return responseError(res, 403, 'TOKEN_INVALID');

            req.adminId = admin._id;
            next();
        })
        .catch(error => {
            console.log('verify token: ' + error.message);
            responseError(res, 500, error.message);
        });
}
