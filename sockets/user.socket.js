const User = require('../models/user.model');
const Result = require('../models/result.model');
const Question = require('../models/question.model');
const jwt = require('../helpers/jwt.helper');
const gameSocket = require('../sockets/game.socket');
const axios = require('axios');

module.exports.loginForTest = (io, socket, data) => {
    const { user_id } = data;

    return User.findOne({ user_id })
        .then(async user => {
            if (!user)
                return socket.emit('responseLogin', { success: false, message: 'USER_NOT_FOUND' });

            if (user.socketId && user.socketId != '')
                if (user.socketId != socket.id) {
                    let oldSocket = user.socketId;
                    let sockets = Object.values(io.sockets.sockets);

                    for (let socketTemp of sockets)
                        if (socketTemp.id == oldSocket) {
                            socketTemp.emit('kickForLogin2Account', { success: true, message: 'ACCOUNT_HAS_BEEN_LOGGED_IN_SOMEWHERE' });
                            socketTemp.disconnect();
                            break;
                        }
                }

            user.socketId = socket.id;
            await user.save();

            return jwt.sign({ user_id });
        })
        .then(token => socket.emit('responseLogin', { success: true, token }))
        .catch(error => {
            console.log('vao error login', error.message);
            socket.emit('responseLogin', { success: false, message: error.message });
        });
}

module.exports.login = (io, socket, data) => {

    // 1. login qua server ACB:
    // - sai => thông báo
    // - đúng => tiếp tục
    // 2. tìm trong db xem có user này chưa:
    // - chưa có => tạo user
    // - đã có => tiếp tục
    // 3. kiểm tra socketId của mỗi user để đá nếu login trùng acc
    // 4. mã hóa token
    // 5. Trả ra

    let userTest = {
        username: 'khacao.acb.hr',
        employeeID: 'khaJelly010101',
        employeeNumber: '100012',
        employeeType: 'EmployeeType',
        firstname: 'Cao',
        lastname: 'Kha',
        mail: 'khacao@jelly.city.vn',
        mobile: '0939998889',
        title: 'Nhân viên',
        user: '125214332134323',
        department: 'Human Resource'
    }

    // const baseUrl = 'https://apigw.acb.com.vn/bs/hrm/employees/ad';
    const baseUrl = 'https://ptsv2.com/';
    const Apikey = '5x3O0QPmFG6bD7OEZ2EqAm88tLTjJGu4';

    const body =
    {
        username: "linhpth01",
        password: "123456"
    };

    return axios({
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            // Apikey
        },
        // url: `${baseUrl}/login`,
        url: baseUrl,
        data: body
    })
        .then(async data => {
            // dùng dữ liệu giả
            let user = await User.findOne({ user: userTest.user });
            if (!user) {
                // axios get user
                // gán vào userTest
                user = new User(userTest);
                await user.save();
            }
            if (user.socketId && user.socketId != '')
                if (user.socketId != socket.id) {
                    let oldSocket = user.socketId;
                    let sockets = Object.values(io.sockets.sockets);

                    for (let socketTemp of sockets)
                        if (socketTemp.id == oldSocket) {
                            socketTemp.emit('kickForLogin2Account', { success: true, message: 'ACCOUNT_HAS_BEEN_LOGGED_IN_SOMEWHERE' });
                            socketTemp.disconnect();
                            break;
                        }
                }

            user.socketId = socket.id;
            await user.save();

            return jwt.sign({ user_id: user.user_id });
        })
        .then(token => socket.emit('responseLogin', { success: true, token }))
        .catch(error => {
            console.log('error: ', error);
            return socket.emit('responseLogin', { success: false, message: 'USER_NOT_FOUND' });
        });
}

module.exports.joinGame = (io, socket, game, playRoom, data, playerJoinedGame) => {
    const { user_id } = data;

    if (!game)
        return socket.emit('confirmJoinedGame', { success: false, message: 'GAME_NOT_OPEN' });

    if (game.status == 'PENDING')
        return socket.emit('confirmJoinedGame', { success: false, message: 'GAME_NOT_OPEN' });

    if (game.status == 'PLAYING')
        return socket.emit('confirmJoinedGame', { success: false, message: 'GAME_IS_PLAYING' });

    if (game.status == 'FINISHED')
        return socket.emit('confirmJoinedGame', { success: false, message: 'GAME_FINISHED' });

    socket.join(playRoom, async () => {
        const user = await User.findOne({ user_id });
        if (!user)
            return socket.emit('confirmJoinedGame', { success: false, message: 'USER_NOT_FOUND' });

        let result = await Result.findOne({ user_id, game_id: game.game_id });
        if (!result)
            result = new Result({
                user_id,
                game_id: game.game_id,
                status: 'PLAYING'
            });

        result.status = 'PLAYING';
        await result.save();

        playerJoinedGame.listPlayerJustJoined.unshift({ user_id: user.user_id, name: user.lastname });
        playerJoinedGame.quantity += 1;

        if (playerJoinedGame.listPlayerJustJoined.length > 30)
            playerJoinedGame.listPlayerJustJoined.pop();

        socket.emit('confirmJoinedGame', { success: true });
        io.emit('getListPlayerJustJoined', { success: true, playerJoinedGame });
    });
}

module.exports.checkToken = (io, socket, token, game, playRoom, watchingRoom) => {

    return jwt.verify(token)
        .then(async obj => {

            if (!obj)
                return socket.emit('confirmCheckToken', { success: false, message: 'TOKEN_INVALID' });

            const { user_id } = obj;
            const user = await User.findOne({ user_id });

            if (!user)
                throw new Error('CHECK_TOKEN_:_USER_NOT_FOUND');

            if (user.socketId && user.socketId != '')
                if (user.socketId != socket.id) {
                    let oldSocket = user.socketId;
                    let sockets = Object.values(io.sockets.sockets);

                    for (let socketTemp of sockets)
                        if (socketTemp.id == oldSocket) {
                            socketTemp.emit('kickForLogin2Account', { success: true, message: 'ACCOUNT_HAS_BEEN_LOGGED_IN_SOMEWHERE' });
                            socketTemp.disconnect();
                            break;
                        }
                }

            user.socketId = socket.id;

            await user.save();

            await new Promise(async resolve => {
                if (game) {
                    const result = await Result.findOne({ user_id, game_id: game.game_id });
                    if (result) {
                        if (result.status == 'PLAYING' && game.status == 'OPENING')
                            socket.join(playRoom, resolve);
                        if (result.status == 'WATCHING')
                            socket.join(watchingRoom, resolve);
                    }
                }
                resolve();
            });
            socket.emit('confirmCheckToken', { success: true });
            return obj;
        })
        .catch(error => {
            console.log('checkToken: ' + error.message);
            socket.emit('confirmCheckToken', { success: false, message: 'TOKEN_INVALID' });
        })
}

module.exports.joinToWatchingRoom = (socket, user_id, game_id, watchingRoom) => {
    return new Promise((resolve, reject) => {
        socket.join(watchingRoom, () => {
            Result.findOneAndUpdate({ user_id, game_id }, { status: 'WATCHING' }, { new: true })
                .then(resolve)
                .catch(error => {
                    console.log('error join watching room: ', error.message);
                    reject(error);
                })
        });
    });
}

module.exports.countCurrentPlayer = (io, playRoom) => io.sockets.adapter.rooms[playRoom] ? io.sockets.adapter.rooms[playRoom].length : 0

module.exports.updateResultForUser = (io, socket, game_id, data, playRoom) => {
    const { user_id, ordinalNumber, isRightAnswer, answer } = data;
    let currentQuestion = ordinalNumber;
    let inputUpdateQues = {};
    return Result.findOne({ user_id, game_id, status: 'PLAYING' })
        .then(async result => {
            if (!result)
                return;
            let lastQuestion = await Question.findOne({ game_id }).sort({ ordinalNumber: -1 });

            if (!lastQuestion)
                return;
            lastQuestion = lastQuestion.ordinalNumber;

            if (isRightAnswer) {
                result.point += 1;
                inputUpdateQues = { $inc: { rightQuantity: 1 } };
                //nếu là câu cuối 
                if (currentQuestion == lastQuestion && result.point == currentQuestion) {
                    result.status = 'WIN';
                }

            } else {
                inputUpdateQues = { $inc: { wrongQuantity: 1 } };
                result.status = 'LOSE';
                socket.leave(playRoom);
            }

            if (answer == 'A')
                inputUpdateQues.$inc.peopleSelectA = 1;
            if (answer == 'B')
                inputUpdateQues.$inc.peopleSelectB = 1;
            if (answer == 'C')
                inputUpdateQues.$inc.peopleSelectC = 1;
            if (answer == 'D')
                inputUpdateQues.$inc.peopleSelectD = 1;

            await result.save();
            return currentQuestion == lastQuestion;
        })
        .then(async lastQues => {
            if (lastQues) {
                let data = await gameSocket.getResult(game_id);
                await Result.updateMany({ game_id, status: 'WIN' }, { prize: data.bonusPerPerson });
                io.to(playRoom).emit('youWin', { success: true, data });
            }
            return Question.findOneAndUpdate({ game_id, ordinalNumber }, inputUpdateQues, { new: true });
        })
        .then(question => {

            io.emit('quantityRightWrongAnswer', {
                success: true,
                quantity: {
                    rightQuantity: question.rightQuantity,
                    wrongQuantity: question.wrongQuantity,
                    peopleSelectA: question.peopleSelectA,
                    peopleSelectB: question.peopleSelectB,
                    peopleSelectC: question.peopleSelectC,
                    peopleSelectD: question.peopleSelectD,
                    totalSelect: question.peopleSelectA + question.peopleSelectB + question.peopleSelectC + question.peopleSelectD
                }
            });
        })
        .catch(error => console.log(error));
}

module.exports.updateLoseForUserNotAnswer = (io, game_id, currentQuestion) => {

    return Result.updateMany({
        game_id,
        status: 'PLAYING',
        point: { $lt: currentQuestion }
    }, { status: 'LOSE' })
        .then(result => {
            return Question.findOneAndUpdate({ game_id, ordinalNumber: currentQuestion },
                { $inc: { wrongQuantity: result.nModified || 0 } }, { new: true });
        })
        .catch(error => console.log(error));
}

// module.exports.updateLoseWhenFinishGame = async (io, game_id) => {
//     let lastQuestion = await Question.findOne({ game_id }).sort({ ordinalNumber: -1 });
//     lastQuestion = lastQuestion.ordinalNumber;

//     return Result.updateMany({
//         game_id,
//         status: 'PLAYING'
//     }, { status: 'LOSE' })
//         .then(result => Question.findOneAndUpdate({ game_id, ordinalNumber: lastQuestion },
//             { $inc: { wrongQuantity: result.nModified || 0 } }, { new: true }))
//         .then(question => {
//             io.emit('quantityRightWrongAnswer', {
//                 success: true,
//                 quantity: {
//                     rightQuantity: question.rightQuantity,
//                     wrongQuantity: question.wrongQuantity
//                 }
//             })
//         })
//         .catch(error => console.log(error));
// }

module.exports.checkInvalidUser = (socket, user_id, game_id, playRoom) => {
    return Result.findOne({ user_id, game_id })
        .then(result => {
            if (!result)
                return;

            if (result.status == 'LOSE')
                return new Promise(resolve => socket.leave(playRoom, resolve));
        })
        .catch(error => {
            console.log(error.message);
        });
}

module.exports.responseUserInfo = (socket, data, game) => {
    if (!game)
        return socket.emit('responseUserInfo', { success: true, data: { status: 'PENDING' } });
    const { game_id } = game;
    const { user_id } = data;
    Result.findOne({ user_id, game_id })
        .then(result => {
            if (!result)
                return socket.emit('responseUserInfo', { success: false, message: 'RESULT_NOT_FOUND' });

            socket.emit('responseUserInfo', { success: true, data: { status: result.status } });
        })
        .catch(error => {
            console.log(error.message);
            socket.emit('responseUserInfo', { success: false, message: error.message });
        });
}

module.exports.socketsLeaveRoom = (io, room) => {
    io.in(room).clients((error, socketIds) => {
        if (error) console.log(error.message);
        socketIds.forEach(socketId => io.sockets.sockets[socketId].leave(room, () => console.log(socketId + ' leave room: ' + room)));
    });
}

module.exports.kickSocketInvalidInPlayRoom = (io, playRoom, game_id) => {
    try {
        let sockets = io.sockets.adapter.rooms[playRoom] ? io.sockets.adapter.rooms[playRoom].sockets : [];

        if (sockets && sockets.length != 0)
            for (let socketId in sockets) {
                User.findOne({ socketId }).populate({ path: 'results', match: { status: { $in: ['PLAYING', 'WIN'] }, game_id } })
                    .then(user => {

                        if (!user || user.results.length == 0)
                            return io.sockets.sockets[socketId].leave(playRoom);
                    })
                    .catch(error => console.log('kickSocketInvalid error: ', error.message));
            }
    }
    catch (error) { console.log('kickSocketInvalid error: ', error.message); }

}