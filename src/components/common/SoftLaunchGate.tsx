import Button from '../ui/Button'
import Container from '../ui/Container'
import type { SoftLaunchDecision } from '../../services/softLaunch'

interface SoftLaunchGateProps {
  decision: SoftLaunchDecision
}

function getMessage(decision: SoftLaunchDecision) {
  if (decision.mode === 'percentage') {
    return 'SHIS Fashion is in a limited soft launch. Your access window is not active yet. Please check back soon.'
  }

  if (decision.reason === 'invite-invalid') {
    return 'Your invite code was not recognized. Please verify the link or request a new invite code from SHIS Fashion.'
  }

  return 'SHIS Fashion is currently invite-only. Use your invitation link to access the store during soft launch.'
}

export default function SoftLaunchGate({ decision }: SoftLaunchGateProps) {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24" aria-labelledby="soft-launch-title">
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col items-center rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-6 py-12 text-center shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:px-10 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Soft Launch</p>
          <h1 id="soft-launch-title" className="mt-4 text-4xl font-semibold tracking-tight text-[var(--color-text)] sm:text-5xl">Limited access rollout in progress</h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-[var(--color-muted)]">{getMessage(decision)}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/" variant="secondary">Retry access</Button>
            <a href="https://wa.me/8801887848304" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--color-border)] px-6 py-3 text-[15px] font-semibold leading-none text-[var(--color-text)] transition hover:border-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.04)]">
              Request invite
            </a>
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Rollout mode: {decision.mode}</p>
        </div>
      </Container>
    </section>
  )
}
