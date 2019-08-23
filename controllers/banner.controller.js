const Game = require('../models/game.model');
const { responseOk, responseError } = require('../helpers/paginate.helper');
const { searchingQueries, pagingOptions } = require('../helpers/paginate.helper');
// const moment = require('moment');

// const Excel = require('exceljs');
// const dirExport = './public/exports/results/';
// const pathRedirect = '/exports/results/';

module.exports.getList = (req, res) => {
    // const { status } = req.query;

    let query = {};
    // if (status == 'all')
    //     input.status = { $ne: null };
    // else if (status)
    //     input.status = status;

    Game.find(input).sort({ createdAt: 'asc' }).then(list => responseOk(res, list))
        .catch(error => responseError(res, 500, error.message));
}

module.exports.getDetail = async (req, res) => {
    const { id } = req.params;
    return Question.findById(id)
        .then(item => {
            if (!item)
                return responseError(res, 404, 'QUESTION_NOT_FOUND');
            responseOk(res, item);
        })
        .catch(error => {
            console.log(error.message);
            responseError(res, 500, error.message);
        });
}

module.exports.create = async (req, res) => {
    Game.init().then(async () => {

        let { body } = req;
        const game_id = Math.ceil(Math.random() * 100000);

        if (moment() > moment(body.start_date))
            return responseError(res, 409, 'START_DATE_INVALID');

        const game = await Game.findOne({ game_id });
        if (game)
            return responseError(res, 409, 'GAME_ID_IS_EXISTED');

        const collection = new Game({
            ...body,
            game_id,
            start_date: moment(body.start_date)
        });

        const err = collection.validateSync();
        if (!err) {
            collection.save().then(data => {
                data = data.toJSON({
                    list: true
                });

                responseOk(res, data);
            }).catch(err => {
                responseError(
                    res,
                    err.message.indexOf('duplicate key error') !== -1
                        ? 409
                        : 500,
                    err.message
                );
            });
        } else {
            responseError(res, 422, err.message);
        }
    })
        .catch(error => {
            console.log(error.message);
            responseError(res, 500, error.message);
        })
}

module.exports.edit = (req, res) => {
    Game.init().then(async () => {
        let { body } = req;

        if (body.game_id)
            delete body.game_id;

        if (body.start_date) {
            if (moment() > moment(body.start_date))
                return responseError(res, 409, 'START_DATE_INVALID');
            else
                body.start_date = moment(body.start_date);
        }

        const game = await Game.findOne({ game_id: req.params.game_id });

        if (game.status != 'PENDING')
            return responseError(res, 700, 'GAME_STATUS_MUST_BE_PENDING');

        Game.findOneAndUpdate(
            { game_id: req.params.game_id },
            body,
            {
                new: true
            }).then(data => {
                if (!data) {
                    responseError(res, 404);
                } else {

                    data = data.toJSON({
                        list: true
                    });
                    responseOk(res, data);
                }
            });
    }).catch(err => {
        responseError(res, 500, err.message);
    });

}

module.exports.getDetail = (req, res) => {
    const { game_id } = req.params;
    Game.init().then(async () => {
        Game.findOne({ game_id })
            .then(game => {
                if (!game)
                    return responseError(res, 404, 'GAME_NOT_FOUND');

                responseOk(res, game);
            })
            .catch(error => {
                console.log(error.message);
                responseError(res, 500, error.message);
            });
    });
}

module.exports.remove = (req, res) => {
    return Game.init().then(async () => {
        const { game_id } = req.params;

        const game = await Game.findOne({ game_id });
        if (!game)
            return responseError(res, 404, 'GAME_NOT_FOUND');

        await Result.deleteMany({ game_id });
        await Question.deleteMany({ game_id });
        await Game.deleteOne({ game_id });
        responseOk(res, { success: true, message: 'ok' });
    })
        .catch(error => responseError(res, 500, error.message));
}