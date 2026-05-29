import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyDiLOGE6tBumMHy97TD5KCvYUetUM5IN6Y",
    authDomain: "chine-algerie.firebaseapp.com",
    projectId: "chine-algerie",
    storageBucket: "chine-algerie.firebasestorage.app",
    messagingSenderId: "441271059274",
    appId: "1:441271059274:web:748eb065116cf0bc9af7b3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Messaging
export const messaging = getMessaging(app);

// Request notification permission
export const requestForToken = async () => {

    try {

        const permission = await Notification.requestPermission();

        if (permission === "granted") {

            console.log("Notification permission granted.");

            const currentToken = await getToken(messaging, {
                vapidKey: "BAQkFPGBoQ15Yu28xJRiA0XdzdwOqDN8FLlGFi5ovAERatnfQ2WKkT05Gd_ICGk-3cqmWBYgAfZbP_jrcX4yxms"
            });

            if (currentToken) {

                console.log("FCM TOKEN:", currentToken);

                return currentToken;

            } else {

                console.log("No registration token available.");

            }

        } else {

            console.log("Notification permission denied.");

        }

    } catch (err) {

        console.error("Error getting token:", err);

    }

};

// Listen foreground notifications
export const onMessageListener = () =>
    new Promise((resolve) => {

        onMessage(messaging, (payload) => {

            resolve(payload);

        });

    });

