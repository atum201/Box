const createError = require('http-errors');
const express = require('express');
const cors = require('cors');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const bodyParser = require('body-parser');

// const userSocket = require('./sockets/user.socket');
// const gameSocket = require('./sockets/game.socket');
// const questionSocket = require('./sockets/question.socket');



require('events').EventEmitter.defaultMaxListeners = 20000;
app.use(cors('*'));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));
                       
let game = null;
let playRoom = 0;
let watchingRoom = 0;
let listQuestion = [];
let people = 0;
let waitForTheNextQuestion = 10;
let waitForTheAnswer = 10;
let currentQuestion = 1;
let countAllPlayer = 0;
let cancel = {
    cancel: false
};
// let playerJoinedGame = {
//     quantity: 0,
//     listPlayerJustJoined: [] // 30 người
// };

// function resetVariable() {
//     game = null;
//     listQuestion = [];
//     playerJoinedGame.listPlayerJustJoined = [];
//     playerJoinedGame.quantity = 0;
//     countAllPlayer = 0;
//     currentQuestion = 1;
//     playRoom = 0;
//     watchingRoom = 0;
// }

io.on('connection', async function (socket) {
    try {
        people++;
        io.emit('peopleOnline', people);

        socket.on('login', function (data,aaa,vvvv) {
            console.log(data,aaa,vvvv);
            // userSocket.loginForTest(io, socket, data);
            // userSocket.login(io, socket, data); 
        });

        // socket.on('process', async function (data) {
        //     try {
        //         if (!data || !data.token)
        //             return socket.emit('confirmCheckToken', { success: false, message: 'TOKEN_INVALID' });

        //         const obj = await userSocket.checkToken(io, socket, data.token, game, playRoom, watchingRoom);

        //         if (!obj || !obj.user_id)
        //             return socket.emit('confirmCheckToken', { success: false, message: 'TOKEN_INVALID' });

        //         data.user_id = obj.user_id;

        //         if (data.event == "joinToWatchingRoom")
        //             await userSocket.joinToWatchingRoom(socket, data.user_id, game.game_id, watchingRoom);

        //         if (game && game.game_id)
        //             await userSocket.checkInvalidUser(socket, data.user_id, game.game_id, playRoom);

        //         switch (data.event) {
        //             case "sendTheResult":
        //                 await userSocket.updateResultForUser(io, socket, game.game_id, data, playRoom);
        //                 break;
        //             case "joinGame":
        //                 await userSocket.joinGame(io, socket, game, playRoom, data, playerJoinedGame);
        //                 break;
        //             case "getGameInfo":
        //                 await gameSocket.responseGameInfo(socket, null, game);
        //                 break;
        //             case "getUserInfo":
        //                 await userSocket.responseUserInfo(socket, data, game);
        //                 break;
        //             case "getCurrentQuestion":
        //                 await questionSocket.getQuestionForWatchingPlayer(io, socket, game.game_id, currentQuestion, playRoom, watchingRoom);
        //                 break;
        //             case "getCountCurrentPlayer":
        //                 socket.emit('countCurrentPlayer', {
        //                     success: true,
        //                     count: await userSocket.countCurrentPlayer(io, playRoom)
        //                 });
        //                 break;
        //             case "getListPlayerJoinedGame":
        //                 socket.emit('getListPlayerJustJoined', { success: true, playerJoinedGame });
        //                 break;
        //             case "getCountAllPlayer":
        //                 socket.emit('responseCountAllPlayer', { success: true, count: countAllPlayer });
        //                 break;
        //             case "joinToWatchingRoom":
        //             case "checkToken":
        //                 break;
        //             default: console.log(data.event, 'EVENT_NOT_FOUND');
        //         }

        //     }
        //     catch (err) {
        //         console.log('process: ', err.message);
        //         socket.emit('serverError', { success: false, message: err.message });
        //     }
        // });

        // socket.on('openGame', async function (data) {
        //     try {
        //         let obj = await gameSocket.open(data.game_id);
        //         let infoGame = await Info.findOne();
        //         let { game: gameTemp,
        //             watchingRoom: watchingRoomTemp,
        //             playRoom: playRoomTemp,
        //             listQuestion: listQuestionTemp,
        //             currentQuestion: currentQuestionTemp,
        //             timeRemaining } = obj;

        //         let {
        //             waitForTheNextQuestion: waitForTheNextQuestionTemp,
        //             waitForTheAnswer: waitForTheAnswerTemp
        //         } = infoGame;

        //         game = gameTemp;
        //         watchingRoom = watchingRoomTemp;
        //         playRoom = playRoomTemp;
        //         listQuestion = listQuestionTemp;
        //         currentQuestion = currentQuestionTemp;
        //         waitForTheAnswer = waitForTheAnswerTemp;
        //         waitForTheNextQuestion = waitForTheNextQuestionTemp;

        //         await gameSocket.responseGameInfo(null, io, game);

        //         await questionSocket.waitTime(io, timeRemaining, 'countDownForStartGame', null, null, cancel);

        //         if (cancel.cancel) {
        //             cancel.cancel = false;
        //             return;
        //         }

        //         game = await Game.findByIdAndUpdate(game._id, { status: 'PLAYING' }, { new: true }).populate('questions');
        //         io.emit('startGame', { success: true });

        //         countAllPlayer = await userSocket.countCurrentPlayer(io, playRoom);
        //         io.to(playRoom).to(watchingRoom).emit('responseCountAllPlayer', {
        //             success: true,
        //             count: countAllPlayer
        //         });

        //         while (1) {
        //             if (!listQuestion.length) {
        //                 game = await Game.findByIdAndUpdate(game._id, { status: 'FINISHED' }, { new: true }).populate('questions');
        //                 io.emit('finishGame');
        //                 break;
        //             }

        //             io.emit('peopleOnline', people);
        //             if (currentQuestion == 1)
        //                 await questionSocket.waitTime(io, waitForTheNextQuestion, 'waitTheNextQuestion', playRoom, watchingRoom);

        //             if (currentQuestion == listQuestion.length) {
        //                 await questionSocket.waitTime(io, 3, 'waitTheLastQuestionPart1', playRoom, watchingRoom);
        //                 await questionSocket.waitTime(io, 2, 'waitTheLastQuestionPart2', playRoom, watchingRoom);
        //                 await questionSocket.waitTime(io, 5, 'waitTheLastQuestionPart3', playRoom, watchingRoom);
        //             }

        //             await questionSocket.getQuestion(io, game.game_id, currentQuestion, playRoom, watchingRoom);
        //             await questionSocket.waitTime(io, waitForTheAnswer, 'waitTheAnswer', playRoom, watchingRoom);
        //             await questionSocket.responseTheAnswer(io, game.game_id, currentQuestion, playRoom, watchingRoom);

        //             await questionSocket.waitTime(null, 5);// đợi hiệu ứng show câu trả lời và gửi đáp án bên frontend 
        //             await userSocket.updateLoseForUserNotAnswer(io, game.game_id, currentQuestion);
        //             userSocket.kickSocketInvalidInPlayRoom(io, playRoom, game.game_id);

        //             if (currentQuestion + 1 < listQuestion.length)
        //                 await questionSocket.waitTime(io, waitForTheNextQuestion, 'waitTheNextQuestion', playRoom, watchingRoom);

        //             if (currentQuestion + 1 > listQuestion.length) {
        //                 game = await Game.findByIdAndUpdate(game._id, { status: 'FINISHED' }, { new: true }).populate('questions');
        //                 io.emit('finishGame');

        //                 let winnerInfo = await gameSocket.getResult(game.game_id);
        //                 console.log(winnerInfo);

        //                 await Result.updateMany({ game_id: game.game_id, status: 'WIN' }, { prize: winnerInfo.bonusPerPerson });
        //                 await Result.updateMany({ game_id: game.game_id, status: 'WATCHING' }, { status: 'LOSE' });

        //                 io.to(playRoom).emit('youWin', { success: true, data: winnerInfo });
        //                 break;
        //             }

        //             currentQuestion++;
        //         }
        //         userSocket.socketsLeaveRoom(io, playRoom);
        //         userSocket.socketsLeaveRoom(io, watchingRoom);
        //         resetVariable();
        //         io.emit('getListPlayerJustJoined', { success: true, playerJoinedGame });
        //     }
        //     catch (err) {
        //         console.log('open game error: ',err.message);
        //         socket.emit('serverError', { success: false, message: err.message });
        //     }
        // });

        // socket.on('shutDownGame', async function (data) {
        //     try {
        //         if (!data || !data.game_id)
        //             throw new Error('GAME_ID_NOT_FOUND');

        //         const { game_id } = data;
        //         const checkGame = await Game.findOne({ game_id });

        //         if (!checkGame)
        //             throw new Error('GAME_NOT_FOUND');

        //         if (checkGame.status == 'PENDING')
        //             throw new Error('GAME_NOT_START');

        //         if (checkGame.status == 'PLAYING')
        //             throw new Error('GAME_IS_PLAYING');

        //         if (checkGame.status == 'FINISHED')
        //             throw new Error('GAME_IS_FINISHED');

        //         checkGame.status = 'PENDING';
        //         await checkGame.save();
        //         cancel.cancel = true;

        //         await Result.updateMany({ game_id, status: 'PLAYING' }, { status: 'PENDING' });

        //         userSocket.socketsLeaveRoom(io, playRoom);
        //         userSocket.socketsLeaveRoom(io, watchingRoom);
        //         resetVariable();

        //         io.emit('responseGameInfo', { success: true, data: { status: 'PENDING' } });
        //         io.emit('getListPlayerJustJoined', { success: true, playerJoinedGame });
        //     }
        //     catch (err) {
        //         console.log('shutdown game error: ',err.message);
        //         socket.emit('serverError', { success: false, message: err.message });
        //     }
        // });

        // socket.on('logOut', function () {
        //     people--;
        //     io.emit('peopleOnline', people);
        //     for (let roomTemp in socket.rooms)
        //         socket.leave(roomTemp);
        // });

        socket.on('disconnect', function () {
            people--;
            io.emit('peopleOnline', people);
        });

        socket.on('logOut', function () {
            people--;
            io.emit('peopleOnline', people);
            for (let roomTemp in socket.rooms)
                socket.leave(roomTemp);
        });

        socket.on('error', function (error) {
            console.log(error);
        });
    } catch (error) {
        console.log(error.message);
        socket.emit('serverError', { success: false, message: error.message });
    }

});

app.use('/static', express.static(path.join(__dirname, 'public')));
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});
app.use((req, res, next) => {
    next(createError(404));
});

process.on('uncaughtException', function (err) {
    console.log(err);
});

server.listen(3000, () => console.log('App start'));

process.on('SIGINT', () => { console.log("Bye bye!"); process.exit(); });



