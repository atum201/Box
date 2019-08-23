const jwt = require('jsonwebtoken');
const SECRET_KEY = 'khaACBGameConfetti';

module.exports.sign = (object) => {
    return new Promise((resolve, reject) => {
        jwt.sign(object, SECRET_KEY, { expiresIn: '7 days' }, function (err, token) {
            if (err)
                return reject(err);

            resolve(token);
        });
    });
}

module.exports.verify = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, SECRET_KEY, function (err, obj) {
            if (err)
                return reject(err);

            resolve(obj);
        });
    });
}