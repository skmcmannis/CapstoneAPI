//Endpoints and model functions related to multiple 'event' objects
//Author: Shawn McMannis
//Last Mod Date: 2/21/2020

const path = require('path')
const router = require(path.join(__dirname, '..', '/config/node_modules/express')).Router();
const bodyParser = require(path.join(__dirname, '..', '/config/node_modules/body-parser'))
const db = require('../config/db.js');
const address = require('../address/address.js');

router.use(bodyParser.json());

//Model Functions
//Retrieve all events
async function getEvents(){
    try {
        var events = await db.getDb().query('SELECT * FROM event');
        return Promise.all(events[0].map(address.getEventAddr));
    } catch (err) {
        console.log('Error encountered: ', err);
    }
}

//Controller Functions
//Retrieve all events
router.get('/', async function(req, res) {
    const accepts = req.accepts(['application/json']);
    const events = await getEvents();
    if (!accepts) {
        res.status(406).send("Not acceptable");
    }
    else if (events.length == 0) {
        res.status(404).send("Not found");
    }
    else {
        res.status(200).send(events);
    }
});

module.exports = { 
    router
};