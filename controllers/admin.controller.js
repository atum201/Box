const Admin = require('../models/admin.model');
const { responseOk, responseError } = require('../helpers/paginate.helper');
const jwt = require('../helpers/jwt.helper');
const { compare } = require('bcrypt');

module.exports.login = (req, res) => {
    const { username, password } = req.body;
    return Admin.findOne({ username })
        .then(async admin => {
            if (!admin)
                throw new Error('USERNAME_OR_PASSWORD_NOT_MATCH');

            const checkPass = await compare(password, admin.password);
            if (!checkPass)
                throw new Error('USERNAME_OR_PASSWORD_NOT_MATCH');

            return admin;
        })
        .then(admin => jwt.sign({ _id: admin._id }))
        .then(token => responseOk(res, { success: true, token }))
        .catch(error => {
            console.log(error.message);
            responseError(res, 500, error.message);
        });
}

module.exports.getInfo = (req, res) => {
    return Admin.findOne()
    .then(admin => {
        if(!admin)
        return responseError(res, 404, 'ADMIN_NOT_FOUND');

        responseOk(res, admin);
    })
    .catch(error => {
        console.log('detail admin: '+error.message);
        responseError(res, 500, error.message);
    })
}

module.exports.editInfo = (req, res) => {
    const idAdmin = req.adminId;
    const { name,
        dateOfBirth,
        phone,
        address } = req.body;

    return Admin.findByIdAndUpdate(idAdmin, {
        name,
        dateOfBirth,
        phone,
        address
    }, { new: true })
        .then(admin => {
            if (!admin)
                return responseError(res, 404, 'ADMIN_NOT_FOUND');

            responseOk(res, admin);
        })
        .catch(error => {
            console.log('edit info admin: '+error.message);
            responseError(res, 500, error.message);
        });
}