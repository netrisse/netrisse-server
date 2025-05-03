module.exports = class Event {
  constructor(eventID, playerID, eventType) {
    this.eventID = eventID;
    this.playerID = playerID;
    this.eventType = eventType;
  }
};
