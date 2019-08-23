const Question = require('../models/question.model');
const Game = require('../models/game.model');
const { responseOk, responseError } = require('../helpers/paginate.helper');

const _ = require('lodash');
const Excel = require('exceljs');
const fs = require('fs');
const dirImport = './excel/imports/questions';

module.exports.list = (req, res) => {
    const { game_id } = req.params;
    return Question.find({ game_id }).sort({ ordinalNumber: 'asc' })
        .then(questions => responseOk(res, questions))
        .catch(error => responseError(res, 500, error.message));
}

module.exports.getDetail = (req, res) => {
    const { id } = req.params;
    return Question.findById(id)
        .then(question => {
            if (!question)
                return responseError(res, 404, 'QUESTION_NOT_FOUND');

            responseOk(res, question);
        })
        .catch(error => {
            console.log(error.message);
            responseError(res, 500, error.message);
        });
}

module.exports.create = (req, res) => {

    Question.init().then(async () => {

        let { body } = req;

        const game = await Game.findOne({ game_id: body.game_id });
        if (!game)
            return responseError(res, 409, 'GAME_NOT_FOUND');

        if (game.status == 'OPENING')
            return responseError(res, 800, 'GAME_IS_OPENING');

        if (game.status == 'PLAYING')
            return responseError(res, 800, 'GAME_IS_PLAYING');

        if (game.status == 'FINISHED')
            return responseError(res, 800, 'GAME_FINISHED');

        const question = await Question.findOne({ game_id: body.game_id, ordinalNumber: body.ordinalNumber });
        if (question)
            return responseError(res, 409, 'ORDINAL_NUMBER_IS_EXISTED');

        const collection = new Question(body);

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

    Question.init().then(async () => {
        let { body } = req;

        if (body && body.game_id)
            delete body.game_id;

        if (body && body.rightQuantity)
            delete body.rightQuantity;

        if (body && body.wrongQuantity)
            delete body.wrongQuantity;

        const question = await Question.findById(req.params.id);
        const game_id = question.game_id;

        const game = await Game.findOne({ game_id });
        if (!game)
            return responseError(res, 404, 'GAME_NOT_FOUND');

        if (game.status == 'OPENING')
            return responseError(res, 800, 'GAME_IS_OPENING');

        if (game.status == 'PLAYING')
            return responseError(res, 800, 'GAME_IS_PLAYING');

        if (game.status == 'FINISHED')
            return responseError(res, 800, 'GAME_FINISHED');

        const checkQuestion = await Question.findOne({ game_id, ordinalNumber: body.ordinalNumber, _id: { $ne: req.params.id } });
        if (checkQuestion)
            return responseError(res, 409, 'ORDINAL_NUMBER_IS_EXISTED');

        Question.findByIdAndUpdate(
            req.params.id,
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

module.exports.remove = async (req, res) => {

    Question.init().then(async () => {

        const question = await Question.findById(req.params.id);
        if (!question)
            return responseError(res, 404, 'QUESTION_NOT_FOUND');

        const game_id = question.game_id;

        const game = await Game.findOne({ game_id });
        if (!game)
            return responseError(res, 404, 'GAME_NOT_FOUND');

        if (game.status == 'OPENING')
            return responseError(res, 800, 'GAME_IS_OPENING');

        if (game.status == 'PLAYING')
            return responseError(res, 800, 'GAME_IS_PLAYING');

        if (game.status == 'FINISHED')
            return responseError(res, 800, 'GAME_FINISHED');

        Question.findByIdAndRemove(req.params.id)
            .then(data => {
                responseOk(res, { success: true, data });
            });
    }).catch(err => {
        responseError(res, 500, err.message);
    });
}

module.exports.importExcel = async (req, res) => {
    try {
        let files = req.files;
        if (!files) {
            return responseError(res, 404);
        }

        let { game_id } = req.body;
        if (!_.parseInt(game_id))
            return responseError(res, 400, "GAME_ID_INVALID");

        const game = await Game.findOne({ game_id });
        if (!game)
            return responseError(res, 404, 'GAME_NOT_FOUND');

        if (game.status == 'OPENING')
            return responseError(res, 800, 'GAME_IS_OPENING');

        if (game.status == 'PLAYING')
            return responseError(res, 800, 'GAME_IS_PLAYING');

        if (game.status == 'FINISHED')
            return responseError(res, 800, 'GAME_FINISHED');

        let fileUpload = req.files.file;
        let name = fileUpload.name.split(".");
        let typeFile = name[name.length - 1];

        if (!fs.existsSync(dirImport)) {
            console.log('ko co duong dan');
            fs.mkdirSync(dirImport);
        }

        var nowMoment = _.now();
        fileUpload.mv(`${dirImport}/${nowMoment}.${typeFile}`, async (err) => {
            if (!err) {
                const errorArray = [];
                const arrPromiseQues = [];
                const workbook = new Excel.Workbook();
                await workbook.xlsx.readFile(`${dirImport}/${nowMoment}.${typeFile}`);

                workbook.eachSheet((worksheet, sheetId) => {
                    worksheet.eachRow((row, rowNumber) => {
                        if (rowNumber > 1) {
                            let data = {
                                game_id,
                                ordinalNumber: row.values[1], // số thứ tự
                                title: row.values[2],
                                answerA: row.values[3],
                                answerB: row.values[4],
                                answerC: row.values[5],
                                answerD: row.values[6],
                                rightAnswer: row.values[7],
                                explain: row.values[8]
                            }

                            const newQues = new Question(data);
                            arrPromiseQues.push(newQues);
                        }
                    })
                });

                for (let question of arrPromiseQues) {
                    const ques = await Question.findOne({ game_id, ordinalNumber: question.ordinalNumber });
                    if (ques)
                        errorArray.push({
                            Number: ques.ordinalNumber,
                            Title: ques.title,
                            Message: 'Số thứ tự của câu hỏi này đã bị trùng.'
                        });
                    else
                        await question.save();
                }

                if (errorArray.length)
                    return responseError(res, 810, { success: false, message: errorArray });
                
                return responseOk(res, { success: true, message: 'Question import successfully!' });

            }
        });
    } catch (err) {
        return responseError(res, 500, err.message);
    }
}
