import { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { getCouponByCode } from '../../firebase/adminService'

interface CouponApplyFieldProps {
  customerEmail?: string
}

export default function CouponApplyField({ customerEmail = '' }: CouponApplyFieldProps) {
  const { appliedCoupon, applyCoupon, removeCoupon } = useCart()
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code ?? '')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMessage, setCouponMessage] = useState('')

  const handleApplyCoupon = async () => {
    const trimmed = couponCode.trim()
    if (!trimmed) {
      setCouponMessage('Please enter a coupon code.')
      return
    }

    setCouponLoading(true)
    setCouponMessage('')

    try {
      const result = await getCouponByCode(trimmed, customerEmail)

      if (!result || result.status !== 'active' || !result.code) {
        setCouponMessage('Invalid or expired coupon code.')
        return
      }

      applyCoupon(result.code, result.id, result.discountPercent)
      setCouponMessage(`Coupon applied. You save ${result.discountPercent}%.`)
    } catch (error) {
      setCouponMessage(error instanceof Error ? error.message : 'Unable to validate coupon. Please try again.')
    } finally {
      setCouponLoading(false)
    }
  }

  return (
    <>
      <p className="text-sm font-medium text-[var(--color-text)]">Promo Code</p>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          className="flex-1 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[16px] text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-black focus:ring-2 focus:ring-black/5"
          maxLength={12}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => { void handleApplyCoupon() }}
          disabled={couponLoading || !couponCode.trim()}
          className="ui-interactive rounded-[1rem] border border-black bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#121212] disabled:cursor-not-allowed disabled:bg-black/35"
        >
          {couponLoading ? 'Applying…' : 'Apply'}
        </button>
      </div>
      {appliedCoupon ? (
        <div className="mt-2 flex items-center justify-between gap-3 text-sm text-emerald-600">
          <p role="status">{couponMessage || `${appliedCoupon.code} applied`}</p>
          <button type="button" onClick={removeCoupon} className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] hover:text-black">
            Remove
          </button>
        </div>
      ) : couponMessage ? (
        <p className="mt-2 text-sm text-red-600" role="alert">{couponMessage}</p>
      ) : null}
    </>
  )
}
