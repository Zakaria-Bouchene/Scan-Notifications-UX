import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";

export async function requestNotificationPermission() {

    // Ask user permission
    const permission = await Notification.requestPermission();

    if (permission === "granted") {

        console.log("Notification permission granted.");

        // Generate Firebase token
        const token = await getToken(messaging, {
            vapidKey: "BAQkFPGBoQ15Yu28xJRiA0XdzdwOqDN8FLlGFi5ovAERatnfQ2WKkT05Gd_ICGk-3cqmWBYgAfZbP_jrcX4yxms"
        });

        console.log("FCM TOKEN:", token);

        return token;

    } else {

        console.log("Permission denied");

    }
}
