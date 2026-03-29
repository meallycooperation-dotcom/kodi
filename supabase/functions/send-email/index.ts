import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "npm:resend@4.0.0"
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"

type EmailActionType =
  | "signup"
  | "recovery"
  | "invite"
  | "magiclink"
  | "email_change"
  | "email_change_new"
  | "phone_change"
  | "reauthentication"

interface EmailData {
  token?: string
  token_hash?: string
  token_new?: string
  token_hash_new?: string
  redirect_to?: string
  email_action_type: EmailActionType
  site_url?: string
  email?: string
  new_email?: string
  old_email?: string
}

interface HookPayload {
  user: {
    email: string
    user_metadata?: Record<string, unknown>
  }
  email_data: EmailData
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? ""
const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "")
const SEND_EMAIL_HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? ""
const hookSecret = SEND_EMAIL_HOOK_SECRET.startsWith("v1,whsec_")
  ? SEND_EMAIL_HOOK_SECRET.replace("v1,whsec_", "")
  : SEND_EMAIL_HOOK_SECRET
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const SENDER_EMAIL = "Kodi <onboarding@kodi.com>"

const SUBJECTS: Record<EmailActionType, string> = {
  signup: "Confirm your Kodi email",
  recovery: "Reset your Kodi password",
  invite: "You were invited to Kodi",
  magiclink: "Log in to Kodi",
  email_change: "Confirm Kodi email change",
  email_change_new: "Confirm the new Kodi email",
  phone_change: "Confirm your Kodi phone change",
  reauthentication: "Confirm Kodi reauthentication",
}

const ACTION_COPY: Record<EmailActionType, string> = {
  signup: "Verify your email",
  recovery: "Reset your password",
  invite: "Accept your invite",
  magiclink: "Log in with this link",
  email_change: "Confirm the email change",
  email_change_new: "Confirm the new email address",
  phone_change: "Confirm the phone number change",
  reauthentication: "Confirm your identity",
}

const jsonHeaders = new Headers({ "Content-Type": "application/json" })

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

const escapeAttr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;")

const buildConfirmationUrl = (emailData: EmailData) => {
  if (!SUPABASE_URL) {
    throw new Error("Missing SUPABASE_URL for confirmation link")
  }

  const token = emailData.token_hash ?? emailData.token
  if (!token) {
    throw new Error("Send email hook did not provide a token")
  }

  const params = new URLSearchParams()
  params.set("token", token)
  params.set("type", emailData.email_action_type)
  if (emailData.redirect_to) {
    params.set("redirect_to", emailData.redirect_to)
  }

  return `${SUPABASE_URL}/auth/v1/verify?${params.toString()}`
}

const buildHtml = (
  actionType: EmailActionType,
  confirmationUrl: string,
  token: string | undefined,
  recipient: string
) => {
  const primaryCopy = ACTION_COPY[actionType] ?? "Confirm the action"
  const buttonLabel = primaryCopy
  const safeUrl = escapeAttr(confirmationUrl)
  const safeToken = token ? escapeHtml(token) : ""
  const safeRecipient = escapeHtml(recipient)

  return `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#0f172a;">
      <p style="font-size:18px;margin-bottom:24px;">Hi ${safeRecipient},</p>
      <p style="font-size:16px;margin-bottom:16px;">${primaryCopy} by clicking the button below.</p>
      <p style="margin:32px 0;">
        <a href="${safeUrl}" style="display:inline-flex;align-items:center;justify-content:center;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:999px;text-decoration:none;font-weight:600;">${buttonLabel}</a>
      </p>
      ${safeToken ? `<p style="font-size:14px;color:#475569;margin-bottom:16px;">Or enter this code: <strong>${safeToken}</strong></p>` : ""}
      <p style="font-size:14px;color:#475569;">If the button fails, paste this link into your browser:</p>
      <p><a href="${safeUrl}" style="color:#7c3aed;word-break:break-all;">${escapeHtml(confirmationUrl)}</a></p>
    </div>
  `
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: jsonHeaders })

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  if (!hookSecret) {
    console.error("Missing SEND_EMAIL_HOOK_SECRET")
    return jsonResponse({ error: "Missing send-email hook secret" }, 500)
  }

  if (!RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY")
    return jsonResponse({ error: "Missing Resend API key" }, 500)
  }

  if (!SUPABASE_URL) {
    console.error("Missing SUPABASE_URL")
    return jsonResponse({ error: "Missing SUPABASE_URL" }, 500)
  }

  if (!resend) {
    console.error("Resend client is not configured")
    return jsonResponse({ error: "Resend client is not configured" }, 500)
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const webhook = new Webhook(hookSecret)

  let hookPayload: HookPayload
  try {
    hookPayload = webhook.verify(payload, headers) as HookPayload
  } catch (error) {
    console.warn("Failed to verify send-email hook", error)
    return jsonResponse({ error: "Unauthorized" }, 401)
  }

  const { user, email_data } = hookPayload

  const confirmationUrl = (() => {
    try {
      return buildConfirmationUrl(email_data)
    } catch (error) {
      console.error(error)
      return null
    }
  })()

  if (!confirmationUrl) {
    return jsonResponse({ error: "Cannot build confirmation link" }, 500)
  }

  const subject = SUBJECTS[email_data.email_action_type] ?? "Confirm your Kodi email"
  const html = buildHtml(
    email_data.email_action_type,
    confirmationUrl,
    email_data.token ?? email_data.token_hash,
    user.email
  )

  try {
    await resend.emails.send({
      from: SENDER_EMAIL,
      to: [user.email],
      subject,
      html,
    })
  } catch (error) {
    console.error("Resend failed", error)
    return jsonResponse({ error: "Failed to send verification email" }, 500)
  }

  return jsonResponse({ success: true })
})
