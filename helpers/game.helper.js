const Game = require('../models/game.model');

module.exports.resetWhenServerDown = () => {
    // game đang mở mà server sập thì chuyển về pending
    Game.findOneAndUpdate({ status: 'OPENING' }, { status: 'PENDING' })
        .then(game => game ? console.log('reset OPENING GAME => PENDING GAME') : '')
        .catch(error => console.log('reset server: ', error.message));

    // game đang chơi mà server sập thì ???
    // TO DO
}  