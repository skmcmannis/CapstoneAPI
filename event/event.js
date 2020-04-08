//Endpoints and model functions related to 'event' objects
//Author: Shawn McMannis
//Last Mod Date: 3/2/2020


const path = require('path')
const router = require(path.join(__dirname, '..', '/config/node_modules/express')).Router();
const validator = require(path.join(__dirname, '..', '/config/node_modules/validator'))
const bodyParser = require(path.join(__dirname, '..', '/config/node_modules/body-parser'))
const uuid = require(path.join(__dirname, '..', '/config/node_modules/uuid/v4'))
const firebase = require('../config/firebase.js');
const db = require('../config/db.js');
const address = require('../address/address.js');

//Circular dependency - refactor this
module.exports = { 
    router,
    getEvent
};

const photo = require('../photo/photo.js');
const userFunctions = require('../user/user.js');
const getS3Upload = require(path.join(__dirname, '..', '/config/s3.js')).getS3Upload;

const siteUrl = 'https://www.memento-wedding.com';

router.use(bodyParser.json());

  
//Utility functions
//Return an upload code
//REDACTED PER NDA
async function getCode[REDACTED]

//Model functions
//REDACTED PER NDA
async function getEventDate[REDACTED]

//Retrieve a single event based on the event_id
async function getEvent(event_id) {
    try {
        const event = await db.getDb().query('SELECT * FROM event WHERE ID = ?', [event_id]);
        return Promise.all(event[0].map(address.getEventAddr));
    } catch (err) {
        console.log('Error encountered: ', err);
    }
}

//Create an event
async function createEvent(req, user_id) {
    try {
        //Ensure the supplied user_id is valid
        var user = await db.getDb().query('SELECT * FROM user WHERE ID = ?', [user_id]);
        if (user[0].length == 0) {
            return 0;
        }
        else {
            try {
                const now = new Date();

                //Generate event upload_code
                const upload_code = [REDACTED];

                //Insert event record
                await db.getDb().query('INSERT INTO `event` (`created`, `lastmod`, `name`, `date`, `user_id`, `description`, `upload_code`, `venue_name`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [now,
                now,
                req.name,
                req.date,
                user_id,
                req.description,
                upload_code,
                req.venue_name]);

                //Retrieve new event_id
                const event_id = await db.getDb().query('SELECT ID FROM event WHERE upload_code = ? AND date = ?', [upload_code, req.date]);

                //Insert event address record
                if(req.street1 || req.street2 || req.city || req.state || req.zip) {
                    await address.insertEventAddr(req, event_id[0][0].ID);
                }

                return event_id[0][0].ID;
            } catch (err) {
                console.log('Error encountered: ', err);
            }
        }
    } catch (err) {
        console.log('Error encountered: ', err);
    }
}


//Controller functions
//Retrieve an event based on either [REDACTED], or event_id
router.get('/', async function(req, res) {
    const accepts = req.accepts(['application/json']);
    var event;

    if(req.query.upload_code) {
        event = await getEventDate[REDACTED];
    } else {
        event = await getEvent(req.query.event_id);
    }

    if (!accepts){
        res.status(406).send("Not acceptable");
    }
    else if (event.length == 0){
        res.status(404).send("Event not found");
    }
    else{
        res.status(200).send(event[0]);
    }
});

//Retrieve an event based on event_id
router.get('/event_id?event_id', async function(req, res) {
    const accepts = req.accepts(['application/json']);

    const event = await getEvent(req.query.event_id);
    if (!accepts){
        res.status(406).send("Not acceptable");
    }
    else if (event.length == 0){
        res.status(404).send("Event not found");
    }
    else{
        res.status(200).send(event[0]);
    }
});

//Create an event
router.post ('/', async function(req, res) {
    const accepts = req.accepts(['application/json']);
    var token;
    if(req.headers.authorization) {
        token = firebase.getToken(req.headers.authorization);
    }
    
    if(token) {
        const user_id = await userFunctions.retrieveId(await firebase.verifyJWT(token));

        if (req.get('content-type') !== 'application/json') {
            res.status(415).send("Server only accepts application/json data");
        }
        else if (!accepts) {
            res.status(406).send("Not acceptable");
        }
        else if (req.body.name && !validator.isAscii(req.body.name)) {
            res.status(400).send("The name attribute is invalid");
        }
        else if (req.body.date && !validator.isAscii(req.body.date)) {
            res.status(400).send("The date attribute is invalid");
        }
        else if (req.body.description && !validator.isAscii(req.body.description)) {
            res.status(400).send("The description attribute is invalid");
        }
        else if (req.body.venue_name && !validator.isAscii(req.body.venue_name)) {
            res.status(400).send("The venue_name attribute is invalid");
        }
        else if (req.body.street_1 && !validator.isAscii(req.body.street_1)) {
            res.status(400).send("The street_1 attribute is invalid");
        }
        else if (req.body.street_2 && !validator.isAscii(req.body.street_2)) {
            res.status(400).send("The street_2 attribute is invalid");
        }
        else if (req.body.city && !validator.isAscii(req.body.city)) {
            res.status(400).send("The city attribute is invalid");
        }
        else if (req.body.state && !validator.isAscii(req.body.state)) {
            res.status(400).send("The state attribute is invalid");
        }
        else if (req.body.zip && !validator.isAscii(req.body.zip)) {
            res.status(400).send("The zip code attribute is invalid");
        } else if (!user_id) {
            res.status(401).send("Unauthorized: Expired token");
        }
        else if (req.body.name && req.body.date) {
            const event_id = await createEvent(req.body, user_id);
            if (event_id == 0) {
                res.status(400).send("This user doesn't exist");
            }
            else {
                const event = await getEvent(event_id);
                res.status(201).send(event[0]);
            }
        }
        else {
            res.status(400).send("The request object is missing at least one of the required attributes");
        }
    } else {
        res.status(401).send("Unauthorized: Invalid token type or missing token");
    }
});

//Retrieve (download) an event photo
router.get ('/:event_id/photo/:photo_uuid', async function (req, res) {
    //Verify event exists
    const event = await getEvent(req.params.event_id);

    if(event.length == 0){
        res.status(404).send('No event with this event_id exists');
    }
    else {
        //Retrieve the extension of the photo (values will be null if no photo exists)
        var photo_ext = await photo.getPhotoExt(req.params.photo_uuid);

        if(photo_ext == null) {
            res.status(404).send('The specified image was not found');
        } else {
            try {
                var data = await photo.getPhoto(req.params.photo_uuid);
                res.attachment(req.params.photo_uuid + photo_ext);
                res.status(200).send(data);
            } catch (err) {
                res.status(400).send(err);
            }
        }
    }
});

//Retrieve information on all event photos
router.get ('/:event_id/photo', async function (req, res) {
    //Verify event exists
    const event = await getEvent(req.params.event_id);

    if(event.length == 0){
        res.status(404).send('No event with this event_id exists');
    }
    else {
        //Retrieve the photo_id's (values will be null if no photos exists)
        var photoData = await photo.getEventPhotoData(req.params.event_id);

        if(photoData) {
            res.status(200).send(photoData);
        }
        else {
            res.status(404).send('No images were found');
        }
    }
});

//Create (upload) an event photo
router.post ('/:upload_code/photo', async function (req, res) {
    //Verify event exists on today's date
    const event = await getEventDate(req.params.upload_code, req.header('event_date'));
    if(event.length == 0){
        res.status(404).send('Cannot find an event with this code today');
    }
    else {
        getS3Upload(uuid()).single('Image')(req, res, async function (err) {
            if(err) {
                res.status(400).send('Image types accepted: .png .jpg .jpeg .gif');
                return;
            }
            //Save database entry
            try {
                await photo.setEventPhoto(event[0].ID, null, req.file.key, path.extname(req.file.originalname));
                var url = siteUrl + '/event/' + event[0].ID + '/photo/' + req.file.key;
                var returnJson = {'photo_uuid': req.file.key, 'self': url};
                res.status(201).json(returnJson);
            } catch (err) {
                console.log(err);
                res.status(400).send('There was a problem with the upload. Please try again');
            }
        })
    }
});