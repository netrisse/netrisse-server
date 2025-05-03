module.exports = class Player {
  lastEventReceived = 0;

  constructor(playerID, socket, playerName) {
    this.playerID = playerID;
    this.socket = socket;
    this.playerName = playerName;
  }
};
