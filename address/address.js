//Endpoints and model functions related to 'address' objects
//Author: Shawn McMannis
//Last Mod Date: 2/21/2020

const db = require('../config/db.js');

//Model functions
//Maps an address to a user
async function getUserAddr(user) {
    try {
        const address = await db.getDb().query('SELECT ID, created, lastmod, street_1, street_2, city, state, zip FROM addr WHERE user_id = ?', [user.ID]);
        if(address[0][0]) {
            user.addr = address[0][0];
        } else {
            user.addr = null;
        }
        return user;
    } catch (err) {
        console.log('Error encountered: ', err);
    }
}

//Inserts a new user address
async function insertUserAddr(addr_data, user_id) {
    const now = new Date();

    try {
        await db.getDb().query('INSERT INTO `addr` (`created`, `lastmod`, `street_1`, `street_2`, `city`, `state`, `zip`, `user_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [now,
        now,
        addr_data.street_1,
        addr_data.street_2,
        addr_data.city,
        addr_data.state,
        addr_data.zip,
        user_id]);

        return 1;
    } catch (err) {
        console.log('Error encountered: ', err);
    }
}

//Updates an existing user address
async function updateUserAddr(addr_data, user_id) {
    const now = new Date();

    try {
        await db.getDb().query('UPDATE `addr` SET `lastmod`=?, `street_1`=?, `street_2`=?, `city`=?, `state`=?, `zip`=? WHERE user_id = ?',
        [now,
        addr_data.street_1,
        addr_data.street_2,
        addr_data.city,
        addr_data.state,
        addr_data.zip,
        user_id]);

        return 1;
    } catch (err) {
        console.log('Error encountered: ', err);
    }
}

//Maps an address to an event
async function getEventAddr(event) {
    try {
        const address = await db.getDb().query('SELECT ID, created, lastmod, street_1, street_2, city, state, zip FROM addr WHERE event_id = ?', [event.ID]);
        if(address[0][0]) {
            event.addr = address[0][0];
        } else {
            event.addr = null;
        }
        return event;
    } catch (err) {
        console.log('Error encountered: ', err);
    }
}

//Inserts a new event address
async function insertEventAddr(addr_data, event_id) {
    const now = new Date();

    try {
        await db.getDb().query('INSERT INTO `addr` (`created`, `lastmod`, `street_1`, `street_2`, `city`, `state`, `zip`, `event_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [now,
        now,
        addr_data.street_1,
        addr_data.street_2,
        addr_data.city,
        addr_data.state,
        addr_data.zip,
        event_id]);

        return 1;
    } catch (err) {
        console.log('Error encountered: ', err);
    }
}

module.exports = {
    getUserAddr,
    insertUserAddr,
    updateUserAddr,
    getEventAddr,
    insertEventAddr
};