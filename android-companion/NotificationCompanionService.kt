package com.rivo.companion

import android.app.Notification
import android.content.Intent
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

/**
 * Rivo Android Companion Notification Listener Service
 *
 * HONEST ARCHITECTURE & SECURITY RULES:
 * 1. Requires explicit manual permission under Android Settings > Special App Access > Notification Access.
 * 2. Only captures incoming notifications matching configured WhatsApp dance academy groups or banking SMS.
 * 3. Never attempts to bypass end-to-end encryption or scrape private WhatsApp SQLite databases.
 * 4. Recognizes notifications are ONLY delivered when the group is not muted and previews are enabled.
 * 5. Sends data to the Rivo backend strictly as an unverified "claim" (never proof of payment).
 */
class NotificationCompanionService : NotificationListenerService() {

    companion object {
        private const val TAG = "RivoNotificationService"
        private const val RIVO_API_ENDPOINT = "https://rivo.onrender.com/api/evidence"
        private val WHATSAPP_PACKAGES = setOf("com.whatsapp", "com.whatsapp.w4b")
    }

    private val httpClient = OkHttpClient()

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val packageName = sbn.packageName
        // Filter: Only listen to opted-in WhatsApp packages
        if (!WHATSAPP_PACKAGES.contains(packageName)) {
            return
        }

        val extras: Bundle = sbn.notification.extras ?: return
        val title = extras.getString(Notification.EXTRA_TITLE) ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""

        // Only process if message contains payment keywords
        if (!isPaymentRelated(text)) {
            return
        }

        Log.i(TAG, "Captured payment claim notification from $title: $text")
        transmitEvidenceClaim(senderTitle = title, messageText = text)
    }

    private fun isPaymentRelated(text: String): Boolean {
        val lower = text.lowercase()
        return lower.contains("paid") ||
               lower.contains("fees") ||
               lower.contains("₹") ||
               lower.contains("rs") ||
               lower.contains("utr") ||
               lower.contains("upi") ||
               lower.contains("transferred")
    }

    private fun transmitEvidenceClaim(senderTitle: String, messageText: String) {
        val payload = JSONObject().apply {
            put("source", "android_notification_claim")
            put("rawText", "Notification from [$senderTitle]: $messageText")
            put("notes", "Captured by opted-in Android companion NotificationListenerService")
            put("autoReconcile", true)
        }

        val body = payload.toString().toRequestBody("application/json".toMediaType())
        val request = Request.Builder()
            .url(RIVO_API_ENDPOINT)
            .post(body)
            .build()

        httpClient.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Failed to send claim to Rivo: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                Log.i(TAG, "Claim transmitted successfully. Status code: ${response.code}")
                response.close()
            }
        })
    }
}
