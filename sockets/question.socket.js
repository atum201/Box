const Question = require('../models/question.model');
const User = require('../models/user.model');
const userSocket = require('../sockets/user.socket');

module.exports.getQuestion = async (io, game_id, questionNumber, playRoom, watchRoom) => {
    let lastQuestion = 0;

    return Question.findOne({ game_id }).sort({ ordinalNumber: -1 })
        .then(async lastQues => {
            
            lastQuestion = lastQues.ordinalNumber;
            
            if (lastQuestion < questionNumber)
                throw new Error('QUESTION_NOT_FOUND');

            return Question.findOne({ game_id, ordinalNumber: questionNumber });
        })
        .then(async question => {
            if (!question)
                return io.to(playRoom).to(watchRoom).emit('responseQuestion', { success: false, message: 'QUESTION_NOT_FOUND' });

            let data = {
                ordinalNumber: question.ordinalNumber,
                title: question.title,
                answerA: question.answerA,
                answerB: question.answerB,
                answerC: question.answerC,
                answerD: question.answerD,
                lastQuestion: false
            };
            if (lastQuestion == questionNumber)
                data.lastQuestion = true;

            io.to(playRoom).to(watchRoom).emit('responseQuestion', { success: true, data });
            return userSocket.countCurrentPlayer(io, playRoom);
        })
        .then(count => io.to(playRoom).to(watchRoom).emit('countCurrentPlayer', {
            success: true,
            count
        }))
        .catch(error => {
            console.log(error);
            return io.to(playRoom).to(watchRoom).emit('responseQuestion', { success: false, message: error.message || 'UNKNOWN' });
        });

}

module.exports.getQuestionForWatchingPlayer = async (io, socket, game_id, questionNumber, playRoom, watchRoom) => {
    let lastQuestion = 0;

    return Question.findOne({ game_id }).sort({ ordinalNumber: -1 })
        .then(lastQues => {
            lastQuestion = lastQues.ordinalNumber;
            if (lastQuestion < questionNumber)
                throw new Error('QUESTION_NOT_FOUND');

            return Question.findOne({ game_id, ordinalNumber: questionNumber });
        }).then(async question => {
            if (!question)
                return socket.emit('responseQuestion', { success: false, message: 'QUESTION_NOT_FOUND' });

            let data = {
                ordinalNumber: question.ordinalNumber,
                title: question.title,
                answerA: question.answerA,
                answerB: question.answerB,
                answerC: question.answerC,
                answerD: question.answerD,
                lastQuestion: false
            };
            if (lastQuestion == questionNumber)
                data.lastQuestion = true;

            socket.emit('responseQuestion', { success: true, data });
            return userSocket.countCurrentPlayer(io, playRoom);
        })
        .then(count => io.to(playRoom).to(watchRoom).emit('countCurrentPlayer', {
            success: true,
            count
        }))
        .catch(error => {
            console.log(error);
            return socket.emit('responseQuestion', { success: false, message: error.message || 'UNKNOWN' });
        });
}

module.exports.responseTheAnswer = (io, game_id, currentQuestion, playRoom, watchRoom) => {
    return Question.findOne({ game_id, ordinalNumber: currentQuestion })
        .then(async question => {
            if (!question)
                return io.to(playRoom).to(watchRoom).emit('responseResult', { success: false, message: 'QUESTION_NOT_FOUND' });

            let data = {
                ordinalNumber: question.ordinalNumber,
                rightAnswer: question.rightAnswer,
                explain: question.explain
            };

            io.to(playRoom).to(watchRoom).emit('responseResult', { success: true, data });

        }).catch(error => {
            console.log(error);
            return io.to(playRoom).to(watchRoom).emit('responseResult', { success: false, message: 'UNKNOWN' });
        })
}

module.exports.waitTime = async (io, second, eventName, playRoom, watchRoom, cancel = { cancel: false }) => {
    return new Promise(resolve => {
        let clearInter = setInterval(async function () {
            if (second >= 0 && cancel && !cancel.cancel) {
                if (io) {
                    if (playRoom)
                        io.to(playRoom);
                    if (watchRoom)
                        io.to(watchRoom);

                    io.emit(eventName, second);
                }
                second--;
            }
            else {
                clearInterval(clearInter);
                resolve(clearInter);
            }
        }, 1000);
    });
}