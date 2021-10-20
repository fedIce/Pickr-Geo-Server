const admin = require('firebase-admin');
const serviceAccount = require("./ncapp-660ed-firebase-adminsdk-2qckf-46792ba92a.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://ncapp-660ed-default-rtdb.europe-west1.firebasedatabase.app/"
});

module.exports.auth =  admin.auth()
module.exports.admin = admin
module.exports.firestore = admin.firestore()