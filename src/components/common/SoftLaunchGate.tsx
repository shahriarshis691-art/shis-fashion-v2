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
        <div className="mx-auto flex max-w-2xl flex-col items-center px-2 py-12 text-center md:py-16">
          <p className="text-caption uppercase tracking-[0.24em] text-black/55">Soft Launch</p>
          <h1 id="soft-launch-title" className="mt-4 text-4xl font-normal tracking-tight text-neutral-900 sm:text-5xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Limited access rollout in progress</h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-neutral-600">{getMessage(decision)}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/" variant="secondary">Retry access</Button>
            <a href="https://wa.me/8801887848304" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center border border-neutral-900 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white">
              Request invite
            </a>
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.14em] text-neutral-400">Rollout mode: {decision.mode}</p>
        </div>
      </Container>
    </section>
  )
}
