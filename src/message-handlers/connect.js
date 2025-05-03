const Player = require('../player');
const { messageTypeEnum } = require('netrisse-lib');
const { games } = require('../common');
const sendMessage = require('../send-message');

module.exports = function({ socket, message }) {
  let game = games[message.gameID];

  if (!game) {
    game = { players: {}, seed: message.seed, heartbeat: Date.now() };
    games[message.gameID] = game;
  }

  if (Object.keys(game.players).length >= 7) {
    throw new Error('player limit is seven');
  }

  socket.send(JSON.stringify({ type: messageTypeEnum.SEED, seed: game.seed }));

  // replace existing player if they exist; this is a new connection
  game.players[message.playerID] = new Player(message.playerID, socket, message.playerName);

  sendMessage(
    message.gameID,
    null, // send null for playerID -- message is coming from the server itself
    JSON.stringify(
      {
        type: messageTypeEnum.CONNECT,
        players: Object.values(game.players).map(({ playerID, playerName }) => ({ playerID, playerName })),
      }));
};
