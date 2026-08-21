import type { OrderNotifyChannel } from './_orderStatus.js'

export async function notifyCustomer(input: {
  channel: OrderNotifyChannel
  orderId: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  paymentMethod?: string
  trackingNumber?: string
  total?: number
}) {
  const name = input.customerName?.trim() || 'there'
  const trackUrl = `https://www.shisfashion.com/track-order?id=${encodeURIComponent(input.orderId)}`
  const tracking = input.trackingNumber?.trim()
  const payment = input.paymentMethod || 'Cash on Delivery'
  const { subject, text } = notifyCopy({
    channel: input.channel,
    name,
    orderId: input.orderId,
    trackUrl,
    tracking,
    payment,
  })

  await Promise.allSettled([
    sendEmail(input.customerEmail, subject, text),
    sendSms(input.customerPhone, text),
  ])
}

function notifyCopy(input: {
  channel: OrderNotifyChannel
  name: string
  orderId: string
  trackUrl: string
  tracking?: string
  payment: string
}) {
  const { channel, name, orderId, trackUrl, tracking, payment } = input

  if (channel === 'order-processing') {
    return {
      subject: `Your SHIS Fashion order ${orderId} is being prepared`,
      text: `Hi ${name}, your SHIS Fashion order ${orderId} is being prepared. Track: ${trackUrl}`,
    }
  }

  if (channel === 'order-shipped') {
    return {
      subject: `Your SHIS Fashion order ${orderId} has shipped`,
      text: `Hi ${name}, your SHIS Fashion order ${orderId} has been shipped.${tracking ? ` Tracking: ${tracking}.` : ''} Track: ${trackUrl}`,
    }
  }

  if (channel === 'order-in-courier') {
    return {
      subject: `Your SHIS Fashion order ${orderId} is with the courier`,
      text: `Hi ${name}, your SHIS Fashion order ${orderId} is with the courier.${tracking ? ` Tracking: ${tracking}.` : ''} Track: ${trackUrl}`,
    }
  }

  if (channel === 'order-delivered') {
    return {
      subject: `Your SHIS Fashion order ${orderId} has been delivered`,
      text: `Hi ${name}, your SHIS Fashion order ${orderId} has been delivered. Thank you for shopping with SHIS Fashion.`,
    }
  }

  if (channel === 'order-cancelled') {
    return {
      subject: `Your SHIS Fashion order ${orderId} was cancelled`,
      text: `Hi ${name}, your SHIS Fashion order ${orderId} has been cancelled. Message us on WhatsApp if you need help.`,
    }
  }

  if (channel === 'order-returned') {
    return {
      subject: `Your SHIS Fashion order ${orderId} return was received`,
      text: `Hi ${name}, we received the return for SHIS Fashion order ${orderId}. Inventory has been restocked. Message us on WhatsApp if you need help.`,
    }
  }

  return {
    subject: `We received your SHIS Fashion order ${orderId}`,
    text: `Hi ${name}, we received your SHIS Fashion order ${orderId}. Payment is ${payment}. We will call to confirm. Track: ${trackUrl}`,
  }
}

async function sendEmail(to: string | undefined, subject: string, text: string) {
  const email = String(to ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return { skipped: true as const, reason: 'no-email' }
  }

  const resendKey = process.env.RESEND_API_KEY ?? ''
  const from = process.env.ORDER_NOTIFY_FROM_EMAIL || 'SHIS Fashion <orders@shisfashion.com>'
  if (resendKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ from, to: [email], subject, text }),
    })
    if (!response.ok) {
      return { skipped: false as const, ok: false }
    }
    return { skipped: false as const, ok: true }
  }

  const sendgridKey = process.env.SENDGRID_API_KEY ?? ''
  if (sendgridKey) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: from.replace(/^.*<|>$/g, '') || 'orders@shisfashion.com' },
        subject,
        content: [{ type: 'text/plain', value: text }],
      }),
    })
    if (!response.ok) {
      return { skipped: false as const, ok: false }
    }
    return { skipped: false as const, ok: true }
  }

  return { skipped: true as const, reason: 'email-unconfigured' }
}

async function sendSms(phone: string | undefined, text: string) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (!digits) {
    return { skipped: true as const, reason: 'no-phone' }
  }

  const e164 = digits.startsWith('88') ? `+${digits}` : `+88${digits.replace(/^0/, '')}`
  const webhook = process.env.SMS_WEBHOOK_URL ?? ''
  if (webhook) {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to: e164, text }),
    })
    return { skipped: false as const, ok: true }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID ?? ''
  const token = process.env.TWILIO_AUTH_TOKEN ?? ''
  const from = process.env.TWILIO_FROM ?? ''
  if (sid && token && from) {
    const body = new URLSearchParams({ To: e164, From: from, Body: text })
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    })
    if (!response.ok) {
      return { skipped: false as const, ok: false }
    }
    return { skipped: false as const, ok: true }
  }

  return { skipped: true as const, reason: 'sms-unconfigured' }
}
