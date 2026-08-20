export async function sendOpsWebhook(text: string) {
  const webhookUrl = process.env.INCIDENT_ALERT_WEBHOOK_URL ?? ''
  if (!webhookUrl || !text.trim()) {
    return
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
  } catch {
    // Ops alerts must never fail the calling request.
  }
}
