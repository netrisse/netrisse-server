const WebSocket = require('ws');
const { debug, Message, messageTypeEnum } = require('netrisse-lib');
const { games } = require('./common');
const handleError = require('./handle-error');
const sendMessage = require('./send-message');
const messageHandlers = require('./message-handlers/handlers');

const arrMessageTypes = Object.freeze(Object.values(messageTypeEnum));

const port = 4752;

const server = new WebSocket.Server({ clientTracking: false, port }, () => {
  if (process.send) { process.send('ready'); }

  const message = `netrisse server is listening on port ${port}`;
  debug(message);
  console.log(message);
});

const statusCodeEnum = Object.freeze({ PLAYER_QUIT: 4333 });

// maybe the multiplayer games start out paused until someone unpauses it
// need to implement spools so that no messages are missed from clients who haven't connected yet

server.on('connection', socket => {
  socket.on('message', rawData => {
    handleMessage(socket, rawData);
  });

  socket.on('close', (code, rawData) => {
    try {
      if (code === statusCodeEnum.PLAYER_QUIT) {
        handleMessage(socket, rawData);
      }
      else {
        debug(`ws closed -- code: ${code}, data: ${rawData}`);
      }
    }
    catch (error) {
      handleError(error);
    }
  });

  socket.on('error', handleError);
});

server.on('error', handleError);

const FIVE_MINUTES_MS = 5 * 60 * 1000;

const purgeIntervalID = setInterval(function purgeStaleGames() {
  // every five minutes, remove stale games

  for (const gameID of Object.keys(games)) {
    const game = games[gameID];
    const diff = Date.now() - game.heartbeat;

    if (diff >= FIVE_MINUTES_MS) {
      const message = `deleting stale game ${gameID}`;
      debug(message);
      console.log(message);

      // send game over
      // make sure we wait for it to complete sending, so we don't call socket.close() before the message can be received
      sendMessage(gameID, null, true, new Message(messageTypeEnum.GAME_OVER).serialize()).then(() => {
        for (const playerID of Object.keys(game.players)) {
          game.players[playerID].socket.close(4334, 'game is stale'); // todo: make enum for close codes
        }

        delete games[gameID];
      });
    }
  }
}, FIVE_MINUTES_MS);

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  clearInterval(purgeIntervalID);

  for (const g of Object.values(games)) {
    for (const p of Object.values(g.players)) {
      p.socket.close(4335, 'server shutdown'); // todo: make enum for close codes
    }
  }

  server.close();
}

function handleMessage(socket, rawData) {
  // debug(rawData);  // client debug log already shows this
  const message = Message.deserialize(rawData);

  if (!arrMessageTypes.includes(message.type)) {
    const err = `unsupported message type: ${message.type}`;
    debug(err);
    throw new Error(err);
  }

  const handler = messageHandlers[message.type];

  // if we have a specific handler for the message type, then call it.
  // otherwise the default is just to pass the message along
  if (handler) {
    handler({ socket, rawData, message });
  }
  else {
    sendMessage(message.gameID, message.playerID, rawData);
  }
}
