# Rivo Android Companion — Architecture & Honest Technical Specification

## 1. Overview
The **Rivo Android Companion** is an optional native module designed to streamline payment evidence capture for teachers who receive payment messages in Android WhatsApp groups.

## 2. Why an Android Notification Companion?
Modern mobile browsers and Progressive Web Apps (PWAs) run in a sandboxed security model that strictly prevents web pages from background-reading other apps' push notifications or messages.

The companion uses Android's official `NotificationListenerService` API.

## 3. Explicit User Permission & Privacy Model
1. **Explicit Permission**: Requires the teacher to navigate to Android **Settings > Special App Access > Notification Access** and toggle "Rivo Companion" on.
2. **Package Filtering**: The service filters strictly for `com.whatsapp` and `com.whatsapp.w4b`. All unrelated applications (email, banking, messages, social media) are completely ignored.
3. **Keyword Filtering**: Only processes notifications containing payment-related terminology (`paid`, `fees`, `₹`, `UTR`, `UPI`, `transferred`).
4. **Data Minimization**: Never collects full chat history, media attachments, or private user messages.

## 4. Real-World Limitations & Honest Boundaries
- **No Background Scraping**: A normal personal WhatsApp account does not offer a public API to query historical group messages. Rivo does not attempt unofficial web scraping or session hijacking.
- **Delivery Required**: The companion can only read notifications that are actually delivered to the device tray. If a WhatsApp group is muted, phone is on Do Not Disturb, or notification previews are hidden on the lockscreen, the notification cannot be captured.
- **Untrusted Input**: Every captured notification is logged in Rivo as an unverified **claim**, NEVER as confirmed proof of payment. Only the teacher's bank statement credit or audited manual verification can mark an obligation as verified.
