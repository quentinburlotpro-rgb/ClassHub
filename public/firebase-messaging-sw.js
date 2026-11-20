importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAJlaDcyO7fyrI28v2m1RC6yQ019-qk-78",
  authDomain: "classhub-fa9bf.firebaseapp.com",
  projectId: "classhub-fa9bf",
  storageBucket: "classhub-fa9bf.firebasestorage.app",
  messagingSenderId: "930925993041",
  appId: "1:930925993041:web:0439945a23ced4e752ec70"
});

const messaging = firebase.messaging();