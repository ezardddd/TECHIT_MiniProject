const { initializeApp } = require('firebase/app');
const { getStorage } = require('firebase/storage');
const firebaseConfig = require('./firebaseConfig');

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

module.exports = { storage };