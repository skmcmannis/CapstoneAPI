//Handles Firebase connection and authorization
//Author: Shawn McMannis
//Last Mod Date: 3/2/2020

const firebase = require('firebase-admin');


//Initialize the Firebase connection
function connectFirebase(callback) {
    try {
    const firebaseApp = firebase.initializeApp({
        credential: firebase.credential.applicationDefault(),
        databaseURL: [REDACTED]
    });
    console.log('Firebase connection initialized');
    return callback(null, firebaseApp);
    } catch(err) {
        console.log('Error encountered: ', err);
    }
}

//Verify the user's Firebase JWT, and extract the user's uid
async function verifyJWT(idToken) {
    try {
        const decodedToken = await firebase.auth().verifyIdToken(idToken);
        if(decodedToken.uid) {
            return decodedToken.uid;
        } else {
            return 0;
        }
    } catch(err) {
        console.log('Error encountered: ', err);
    }
}

//Extract the JWT from the authorization token
function getToken(token){
    var tokenArr = token.split(" ");
    if(tokenArr[0] == 'Bearer'){
        return tokenArr[1];
    }
    else{
        return null;
    }
}

module.exports = {
    connectFirebase,
    getToken,
    verifyJWT
}