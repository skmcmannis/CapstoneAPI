//Handles the S3 connection
//Author: Shawn McMannis
//Last Mod Date: 2/25/2020
//Inspiration for part of this code from:
//  https://itnext.io/how-to-share-a-single-database-connection-in-a-node-js-express-js-app-fcad4cbcb1e

const bucketName = [REDACTED];
const AWS = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
const path = require('path')

//AWS S3 datastore connection
var _s3;

//Create S3 connection
function connectS3(callback) {
    if(_s3) {
        console.log("Already connected to S3");
        return callback(null, _s3);
    }
    try{
        _s3 = new AWS.S3({
            params: { Bucket: bucketName }
        });
        console.log("Connected to " + bucketName);
        return callback(null, _s3);
    } catch (err) {
        console.log('Error encountered: ', err);
    }
}

//Return the S3 connection
function getS3() {
    if(_s3) {
        return _s3;
    }
    else {
        console.log("Not yet connected to S3");
    }
}

//Return the (Multer upload) S3 connection
function getS3Upload(uuid) {
    if(!_s3) {
        connectS3((err) => {});
    }
    return multer({
        storage: multerS3({
            s3: _s3,
            bucket: 'memento-wedding',
            key: function(req, file, callback) {
                console.log(file);
                callback(null, uuid);
            },
        }),
        fileFilter: function(req, file, callback) {
            var ext = path.extname(file.originalname).toLowerCase();
            if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.gif') {
                callback(new Error('Image types accepted: .png .jpg .jpeg .gif'));
            }
            else {
                callback(null, true);
            }
        }
    })
}

//Set download parameters
function setParams(filename) {
    return {
        Bucket: bucketName,
        Key: filename
    }
}

//Get photo from S3
function getPhoto(filename) {
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

module.exports = {
    connectS3,
    getS3,
    getS3Upload,
    getPhoto
};