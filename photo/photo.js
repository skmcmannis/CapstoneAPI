//Endpoints and model functions related to 'photo' objects
//Author: Shawn McMannis
//Last Mod Date: 2/26/2020
//Parts redacted per NDA

const path = require('path')
const router = require(path.join(__dirname, '..', '/config/node_modules/express')).Router();
const bodyParser = require(path.join(__dirname, '..', '/config/node_modules/body-parser'))
const db = require('../config/db.js');
const user = require('../user/user.js');
const s3 = require('../config/s3.js');

router.use(bodyParser.json());

const bucketName = [REDACTED];
const siteUrl = 'https://www.memento-wedding.com';

//Utility functions
//Get a photo's uuid and extension based on the photo_id
async function getFilename(photo_id){
    try{
        photo_name = await db.getDb().query('SELECT photo_uuid, photo_ext FROM photo WHERE photo_id = ?', [photo_id]);
        return photo_name[0][0];
    } catch(err) {
        console.log('Error encountered: ', err);
    }
}

//Get the photo_id of a user's profile photo
async function getProfilePhotoId(user_id){
    try{
        photo_id = await db.getDb().query('SELECT profile_photo_id FROM user WHERE ID = ?', [user_id]);
        return photo_id[0][0].profile_photo_id;
    } catch(err) {
        console.log('Error encountered: ', err);
    }
}

//Set download parameters
function setParams(filename) {
    return {
        Bucket: bucketName,
        Key: filename
    }
}

//Model functions
//Confirm a photo exists based on photo_id
//(Does not return a photo object)
async function confirmPhoto(photo_id){
    try {
        const photo = await db.getDb().query('SELECT * FROM event_photo WHERE photo_id = ?', [photo_id]);
        if(photo[0].length > 0) {
            return 1;
        } else {
            return 0;
        }
    } catch(err) {
        console.log('Error encountered: ', err);
    }
}

//Get photo from S3
function getPhoto(filename) {
    const _s3 = s3.getS3();

    return new Promise(function (res, rej) {
        _s3.getObject(setParams(filename), function(err, data) {
            try {
                if(!err) {
                    res(data.Body);
                }
                else {
                    res(err);
                }
            } catch (error) {}
        });
    })
}

//Delete a photo from S3
function deletePhotoS3(filename) {
    const _s3 = s3.getS3();

    const params = {
        Key: filename
    };

    return new Promise(function (res, rej) {
        _s3.deleteObject(params, function(err, data) {
            try {
                if (err) {
                    res("There was an error deleting the photo: ", err.message);
                }
                else {
                    res();
                }
            } catch (err) {}
        });
    })
}

//Delete a photo from the photo database table
async function deletePhotoDb(photo_id) {
    try {
        await db.getDb().query('DELETE FROM `photo` WHERE `photo_id` = ?', [photo_id]);
        return 1;
    } catch(err) {
        console.log('Error encountered: ', err);
        return err;
    }
}

//Save photo information to the photo table
async function savePhoto(photo_uuid, photo_ext) {
    //Save the filename to the photo table
    try {
        const now = new Date();

        await db.getDb().query('INSERT INTO photo (created, lastmod, photo_uuid, photo_ext) VALUES (?, ?, ?, ?)',
            [now,
            now,
            photo_uuid,
            photo_ext]);

        const id = await db.getDb().query('SELECT photo_id FROM photo WHERE photo_uuid = ?', [photo_uuid]);

        return id[0][0].photo_id;
    } catch (err) {
        return err;
    }
}

//Retrieve data on all event photos
async function getEventPhotoData(event_id) {
    var data = [];
    const photo_ids = await db.getDb().query('SELECT photo_id FROM event_photo WHERE event_id = ?', [event_id]);

    if(photo_ids[0]) {
        for(i=0; i < photo_ids[0].length; i++) {
            var temp = await db.getDb().query('SELECT photo_id, photo_uuid, photo_ext FROM photo WHERE photo_id = ?', [photo_ids[0][i].photo_id]);
            if(temp[0][0]) {
                var temp_json = {'photo_id' : temp[0][0].photo_id, 'photo_uuid': temp[0][0].photo_uuid, 'photo_ext': temp[0][0].photo_ext};
                data[i] = temp_json;
            }
        };
        var photos = [];

        data.forEach(entry => {
            entry.url = siteUrl + '/event/' + event_id + '/photo/' + entry.photo_uuid;
            entry.comments = [];
            entry.hearts = {'user_id': []};
            photos.push(entry);
        });

        return {'event_id': event_id, 'photos': photos};
    } else {
        return null;
    }
}

//Retrieve a photo's file extension
async function getPhotoExt(photo_uuid) {
    try {
        const results  = await db.getDb().query('SELECT photo_ext FROM photo WHERE photo_uuid = ?', [photo_uuid]);
        return results[0][0].photo_ext;
    } catch(err) {
        console.log('Error encountered: ', err);
        return null;
    }
}

//Save the event photo filename to the event record entry
async function setEventPhoto(event_id, user_id, photo_uuid, photo_ext) {
    //Save the filename to the event table
    const now = new Date();

    //Save the photo info in the database
    const photo_id = await savePhoto(photo_uuid, photo_ext);

    try {
        await db.getDb().query('INSERT INTO `event_photo` (`created`, `lastmod`, `photo_id`, `event_id`, `user_id`) VALUES (?, ?, ?, ?, ?)',
        [
            now,
            now,
            photo_id,
            event_id,
            user_id
        ]);
        return 1;
    } catch (err) {
        console.log('Error encountered: ', err);
        return err;
    }
}

//Save the user profile photo to the user record entry
async function setProfilePhoto(user_id, photo_uuid, photo_ext) {
    //Delete the current user profile photo
    deleteProfilePhoto(user_id);

    //Save the photo info in the database
    const photo_id = await savePhoto(photo_uuid, photo_ext);

    //Save the photo_id to the user table
    try {
        await db.getDb().query('UPDATE user SET profile_photo_id = ? WHERE ID = ?', [photo_id, user_id]);
        return;
    } catch (err) {
        console.log('Error encountered: ', err);
        return err;
    }
}

//Deletes a user profile picture from both the database and the S3 bucket
async function deleteProfilePhoto(user_id) {
    const photo_id = await db.getDb().query('SELECT profile_photo_id FROM user WHERE ID = ?', [user_id]);

    if(photo_id[0][0].profile_photo_id) {
        const photo_uuid = await getFilename(photo_id[0][0].profile_photo_id);
        await deletePhotoS3(photo_uuid.photo_uuid);
        await deletePhotoDb(photo_id[0][0].profile_photo_id);
        return 1;
    } else {
        return 0;
    }
}

//Deletes all event photos from events owned by the provided user
async function deleteEventPhotos(user_id) {
    const event_ids = await db.getDb().query('SELECT ID FROM event WHERE user_id = ?', [user_id]);
    if (event_ids[0][0]) {
        for(i = 0; i < event_ids[0][0].ID.length; i++) {
            var photo_id = await db.getDb().query('SELECT photo_id FROM event_photo WHERE event_id = ?', [event_ids[0][0].ID[i]]);
            var photo_uuid = await getFilename(photo_id[0][0].photo_id);
            await deletePhotoS3(photo_uuid.photo_uuid);
            await deletePhotoDb(photo_id[0][0].photo_id);
        }
    }
    return;
}

//'Heart' a photo
async function heartPhoto(photo_id, user_id) {
    try {
        const now = new Date();

        //Verify photo_id and user_id exist
        const user_confirm = await user.getUser(user_id);
        const photo_confirm = await confirmPhoto(photo_id);

        if(user_confirm.length > 0 && photo_confirm == 1) {
            await db.getDb().query('INSERT INTO `user_photo` (`lastmod`, `photo_id`, `user_id`) VALUES (?, ?, ?)',
                [now,
                photo_id,
                user_id]);
            return 1;
        } else {
            return 0;
        }
    } catch(err) {
        console.log('Error encountered: ', err);
        return -1;
    }
}

//Return a list of users who have 'hearted' a particular event photo
async function photoUsers(photo_id) {
    try {

        //Verify photo_id exist
        const photoConfirm = await confirmPhoto(photo_id);

        if(photoConfirm == 1) {
            const user_data = await db.getDb().query('SELECT `user_id` FROM `user_photo` WHERE `photo_id` = ?', [photo_id]);
            var user_id = [];
            user_data[0].forEach(entry => {
                user_id.push(entry.user_id);
            });
            const ret_val = {'user_id': user_id}
            return ret_val;
        } else {
            return 0;
        }
    } catch(err) {
        console.log('Error encountered: ', err);
    }
}

//'un-Heart' a photo
async function unHeartPhoto(photo_id, user_id) {
    try {
        //Verify photo_id and user_id exist
        const user_confirm = await user.getUser(user_id);
        const photo_confirm = await confirmPhoto(photo_id);

        if(user_confirm.length > 0 && photo_confirm == 1) {
            await db.getDb().query('DELETE FROM `user_photo` WHERE `photo_id` = ? AND `user_id` = ?',
                [photo_id,
                user_id]);
            return 1;
        } else {
            return 0;
        }
    } catch(err) {
        console.log('Error encountered: ', err);
    }
}

//Controller functions
//'Heart' a photo
router.post('/:photo_id/user/:user_id', async function(req, res) {
    const accepts = req.accepts(['application/json']);
    if(!accepts) {
        res.status(406).send("Not acceptable");
    } else {
        const result = await heartPhoto(req.params.photo_id, req.params.user_id);
        if(result == 1) {
            res.status(201).send();
        } else if (result == 0) {
            res.status(404).send("Photo or user not found");
        } else {
            res.status(400).send("This user already hearted this photo");
        }
    }
});

//Return list of users who have 'hearted' a photo
router.get('/:photo_id/user', async function(req, res) {
    const accepts = req.accepts(['application/json']);
    if(!accepts) {
        res.status(406).send("Not acceptable");
    } else {
        const users = await photoUsers(req.params.photo_id);

        if(users == 0) {
            res.status(404).send("Photo not found");
        } else if(users.user_id.length > 0) {
            res.status(200).send(users);
        } else {
            res.status(404).send("No users have hearted this photo");
        }
    }
});

//'un-Heart' a photo
router.delete('/:photo_id/user/:user_id', async function(req, res) {
    const accepts = req.accepts(['application/json']);
    if(!accepts) {
        res.status(406).send("Not acceptable");
    } else {
        const result = await unHeartPhoto(req.params.photo_id, req.params.user_id);
        if(result == 1) {
            res.status(204).send();
        } else if (result == 0) {
            res.status(404).send("Photo or user not found");
        }
    }
});


module.exports = {
    router,
    deleteEventPhotos,
    deleteProfilePhoto,
    getFilename,
    getPhoto,
    getProfilePhotoId,
    setProfilePhoto,
    setEventPhoto,
    getEventPhotoData,
    getPhotoExt
};