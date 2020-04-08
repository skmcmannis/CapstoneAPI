//Main server application
//Author: Shawn McMannis
//Last Mod Date: 2/24/2020

const express = require('express')
const app = express();
const port = 3000
const path = require('path')
const userRoutes = require('../user/user.js')
const eventRoutes = require('../event/event.js')
const eventsRoutes = require('../event/events.js')
const photoRoutes = require('../photo/photo.js')
const connectDb = require('./db.js').connectDb;
const connectS3 = require('./s3.js').connectS3;
const connectFirebase = require('./firebase.js').connectFirebase;

//Routes for 'user' objects
app.use('/user', userRoutes.router);

//Routes for 'event' objects
app.use('/event', eventRoutes.router);

//Routes for multiple 'event' objects
app.use('/events', eventsRoutes.router);

//Routes for 'photo' objects
app.use('/photo', photoRoutes.router);

//Route to serve 'static' content
app.use(express.static(path.join(__dirname, '..', 'build')));
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
})

//Connect database and start listener service
connectDb(function (err) {
    connectS3(function (err) {
        connectFirebase(function (err) {
            app.listen(port, (function (err) {
                if(err) throw err;
                console.log(`Memento server listening on port ${port}!`);
            }));
        });
    });
});
