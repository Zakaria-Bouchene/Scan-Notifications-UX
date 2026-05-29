importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDiLOGE6tBumMHy97TD5KCvYUetUM5IN6Y",
    authDomain: "chine-algerie.firebaseapp.com",
    projectId: "chine-algerie",
    storageBucket: "chine-algerie.firebasestorage.app",
    messagingSenderId: "441271059274",
    appId: "1:441271059274:web:748eb065116cf0bc9af7b3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Background message ', payload);
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/icon-192.png'
    });
});