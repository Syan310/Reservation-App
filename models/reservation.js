const { MongoClient } = require('mongodb');

class Reservation {
    constructor(db) {
        this.collection = db.collection('reservations');
    }

    async create(data) {
        const result = await this.collection.insertOne(data);
        return result;
    }
}

module.exports = Reservation;
