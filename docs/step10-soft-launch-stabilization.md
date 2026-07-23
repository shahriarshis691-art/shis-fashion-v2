# Step 10 - Soft Launch + Stabilization

## Objective

Roll out the storefront to a limited audience first, detect issues early, and enforce strict bug-fix turnaround during launch week.

## 1) Limited Audience Rollout

Use one mode at a time via environment variables:

- Percentage rollout:
  - `VITE_SOFT_LAUNCH_MODE=percentage`
  - `VITE_SOFT_LAUNCH_PERCENT=20` (or `30`)
  - `SOFT_LAUNCH_MODE=percentage`
  - `SOFT_LAUNCH_PERCENT=20` (or `30`)
- Invite-only campaign:
  - `VITE_SOFT_LAUNCH_MODE=invite-only`
  - `VITE_SOFT_LAUNCH_INVITE_CODES=codeA,codeB,codeC`
  - `SOFT_LAUNCH_MODE=invite-only`
  - `SOFT_LAUNCH_INVITE_CODES=codeA,codeB,codeC`
  - Shared links: `https://www.shisfashion.com/?invite=codeA`

Notes:
- Admin routes are always accessible.
- In local development, soft launch is bypassed unless `VITE_SOFT_LAUNCH_ENFORCE_IN_DEV=true`.
- Edge middleware applies server-side enforcement in production.

## 2) Error Monitoring + Session Replay

### Error Monitoring

- Global browser errors are captured through `window.error` and `unhandledrejection`.
- Exceptions are sent into GA as `exception` events with `fatal` flag.

### Session Replay

- Microsoft Clarity is optional and enabled when:
  - `VITE_CLARITY_PROJECT_ID=<your-project-id>`

Review cadence:
- Check error spikes every 2 hours in launch week.
- Review at least top 20 high-friction sessions daily.

## 3) Bug-Fix SLA

- P0 (checkout broken, cannot place order, site down): same day
- P1 (major UX break, key flow blocked on one platform): 24 hours
- P2 (minor UI/data issue, workaround exists): 3 days

Escalation:
1. Detect (error dashboard/session replay/customer report)
2. Triage severity (P0/P1/P2)
3. Assign owner + ETA
4. Hotfix + verification
5. Post-fix validation on real device matrix

## 4) Daily Conversion Funnel Review

Track daily (GA4):
- `page_view`
- `view_item`
- `add_to_cart`
- `begin_checkout`
- `purchase`
- `search`
- `exception`

Compute key rates:
- Product View Rate = `view_item / page_view`
- Add-to-Bag Rate = `add_to_cart / view_item`
- Checkout Start Rate = `begin_checkout / add_to_cart`
- Purchase Rate = `purchase / begin_checkout`

Suggested daily ritual (15 minutes):
1. Compare today vs yesterday for each metric.
2. Check device split (Android/iOS/tablet/desktop).
3. Review top errors + related replay sessions.
4. Raise P0/P1 tickets immediately.

## 5) Launch-Day Checklist

- Soft launch mode enabled correctly.
- Invite links validated (if invite-only).
- GA events visible in DebugView.
- Clarity recording active.
- Error monitoring events visible.
- Checkout smoke test completed (happy + failure path).
