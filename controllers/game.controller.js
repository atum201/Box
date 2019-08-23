const Game = require('../models/game.model');
const Result = require('../models/result.model');
const Question = require('../models/question.model');
const { responseOk, responseError } = require('../helpers/paginate.helper');
const { searchingQueries, pagingOptions } = require('../helpers/paginate.helper');
const moment = require('moment');

const Excel = require('exceljs');
const dirExport = './public/exports/results/';
const pathRedirect = '/exports/results/';

module.exports.getResult = (req, res) => {
    const { status } = req.query;

    let input = {};
    if (status == 'all')
        input.status = { $ne: null };
    else if (status)
        input.status = status;

    Game.find(input).sort({ createdAt: 'asc' }).populate({
        path: 'results',
        match: {
            status: 'WIN'
        },
        populate: {
            path: 'user'
        }
    }).then(data => {
        res.send(data);
    }).catch(err => {
        console.log(err);
        res.send(err.message);
    });
}

module.exports.getListFinishResult = (req, res) => {
    const { status } = req.query;

    let input = {};
    if (status == 'all')
        input.status = { $ne: null };
    else if (status)
        input.status = status;

    Game.find(input).sort({ start_date: 'desc' }).populate({
        path: 'results',
        match: {
            status: 'WIN'
        },
        populate: {
            path: 'user'
        }
    }).then(data => {
        res.send(data);
    }).catch(err => {
        console.log(err);
        res.send(err.message);
    });

}

module.exports.getResultDetail = async (req, res) => {
    const { game_id } = req.params;
    Result.paginate(searchingQueries(req, null, { add: { game_id, status: 'WIN' } }), pagingOptions(req, [{ path: 'user' }, { path: 'game' }]))
        .then(data => {
            responseOk(res, data);
        })
        .catch(error => {
            console.log(error.message);
            responseError(res, 500, error.message);
        })
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

module.exports.getGameForPendingPage = (req, res) => {

    return Game.find(
        {
            status: { $in: ['PENDING', 'OPENING'] },
            start_date: { $gt: moment() }
        }).sort({ start_date: 'asc' }).then(data => {
            responseOk(res, data);
        }).catch(err => {
            console.log(err);
            responseError(res, 500, err.message);
        });
}

module.exports.export = (req, res) => {

    return Game.init().then(async () => {

        const { game_id, status, user_id } = req.query;
        let filter = {
            game_id: {},
            status: {},
            user_id: { "$regex": '', "$options": "i" }
        };

        if (game_id == 'all')
            delete filter.game_id;
        else
            filter.game_id = game_id;

        if (status == 'all')
            filter.status = { $in: ['WIN', 'LOSE'] };
        else
            filter.status = status;

        if (user_id)
            filter.user_id = { "$regex": user_id, "$options": "i" };

        let game = null;
        if (game_id != 'all')
            game = await Game.findOne({ game_id: filter.game_id });

        if (!game && game_id != 'all')
            return responseError(res, 404, 'GAME_NOT_FOUND');


        var workbook = new Excel.Workbook();
        let sheet = workbook.addWorksheet('Result');
        sheet.columns = [
            { header: 'Number', key: 'number', width: 10 },
            { header: 'Game', key: 'game', width: 15 },
            { header: 'UserId', key: 'user_id', width: 25 },
            { header: 'Fullname', key: 'name', width: 30 },
            { header: 'Point', key: 'point', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Prize', key: 'prize', width: 20 },
            { header: 'GameId', key: 'game_id', width: 15 },
            { header: 'Time', key: 'time', width: 40 }
        ];

        const results = await Result.find(filter).populate([{ path: 'game' }, { path: 'user' }]);
        let i = 0;
        for (let result of results) {

            if (!result)
                continue;

            i++;
            sheet.addRow({
                number: i,
                game: result.game ? (result.game ? result.game.name : '') : '',
                user_id: result.user ? (result.user ? result.user.user_id : '') : '',
                name: result.user ? (result.user ? result.user.lastname : '') : '',
                point: result.point,
                status: result.status,
                prize: result.prize,
                game_id: result.game ? (result.game ? result.game.game_id : '') : '',
                time: result.game ? (result.game ? moment(result.game.start_date).format('DD/MM/YYYY') : '') : ''
            });
        }

        const filename = `Result-${game_id == 'all' ? 'ALL' : game_id}-${Date.now()}.xlsx`;
        const pathFile = `${dirExport}${filename}`;
        const pathDownload = `${pathRedirect}${filename}`;

        await workbook.xlsx.writeFile(pathFile);
        res.redirect(`${req.protocol}://${req.get('host')}${pathDownload}`);// host 
    })
        .catch(error => {
            console.log('Export: ' + error.message);
            responseError(res, 500, error.message);
        })
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