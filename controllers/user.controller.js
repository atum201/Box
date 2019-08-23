const User = require('../models/user.model');
const Result = require('../models/result.model');
const { responseError, responseOk } = require('../helpers/paginate.helper');
const { searchingQueries, pagingOptions } = require('../helpers/paginate.helper');

module.exports.getUserByGameId = (req, res) => {
    const { game_id } = req.params;
    return User.find({ game_id }).then(data => responseOk(res, data)).catch(error => {
        console.log(error.message);
        responseError(res, 500, error.message);
    });
}

module.exports.getListUser = (req, res) => {
    const { game_id, status } = req.query;

    let add = {};

    if (game_id == 'all')
        add.game_id = { $ne: null };
    // delete add.game_id;
    else if (game_id)
        add.game_id = game_id;
    else
        return responseError(res, 404, 'GAME_ID_NOT_FOUND');

    if (status == 'all')
        add.status = { $in: ['WIN', 'LOSE'] };
    else if (status == 'WIN')
        add.status = 'WIN';
    else if (status == 'LOSE')
        add.status = 'LOSE';
    else
        return responseError(res, 404, 'STATUS_NOT_FOUND');


    return Result.paginate(searchingQueries(req, ['user_id'], { add }),
        pagingOptions(req, [{
            path: 'user'
        }, {
            path: 'game',
            match: { status: 'FINISHED' }
        }
        ]))
        .then(results => {
            for (let i = 0; i < results.docs.length; i++)
                if (results.docs[i].game === null) {
                    results.docs.splice(i, 1);
                    i--;
                }

            responseOk(res, results);
        })
        .catch(error => {
            console.log(error.message);
            responseError(res, 500, error.message);
        });
}

module.exports.getDetail = (req, res) => {
    const { user_id } = req.params;

    // return User.findOne({ user_id })
    //     .populate({
    //         path: 'results',
    //         match: {
    //             status: { $in: ['WIN', 'LOSE'] }
    //         }
    //     })
    //     .then(user => {
    //         if (!user)
    //             return responseError(res, 500, 'USER_NOT_FOUND');

    //         responseOk(res, user);
    //     })
    //     .catch(error => {
    //         console.log(error.message);
    //         responseError(res, 500, error.message);
    //     });

    return Result.paginate(
        searchingQueries(req, null, { add: { user_id, status: { $in: ['WIN', 'LOSE'] } } }),
        pagingOptions(req, [{ path: 'game' }])
    )
        .then(data => {
            responseOk(res, data);
        })
        .catch(error => {
            console.log(error.message);
            responseError(res, 500, error.message);
        })
}