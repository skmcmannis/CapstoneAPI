//Handles the database connection pool
//Author: Shawn McMannis
//Last Mod Date: 2/3/2020
//Inspiration for this code from:
//  https://itnext.io/how-to-share-a-single-database-connection-in-a-node-js-express-js-app-fcad4cbcb1e

const mysql = require('mysql2/promise')

var _pool;

//Create MySQL connection pool
//Variables stored in .env
function connectDb(callback) {
    if(_pool) {
        console.log("Already connected to the database");
        return callback(null, _pool);
    }
    
    try{
        _pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DATABASE
        });
        console.log("Connected to " + process.env.DATABASE);
        return callback(null, _pool);
    } catch (err) {
        console.log('Error encountered: ', err);
    }
}

//Return the database connection pool
function getDb() {
    if(_pool) return _pool;
    else {
        console.log("Not yet connected to the database");
    }
}

module.exports = {
    connectDb,
    getDb
};