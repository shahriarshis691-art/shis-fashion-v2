import { KIDS_SIZE_GUIDE_ROWS } from '../../data/kidsOversizedTeeCollection'

interface KidsSizeGuideModalProps {
  onClose: () => void
}

export default function KidsSizeGuideModal({ onClose }: KidsSizeGuideModalProps) {
  return (
    <div className="fixed inset-0 z-[96] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Kids size guide">
      <button type="button" className="absolute inset-0 bg-black/55" aria-label="Close size guide" onClick={onClose} />
      <div className="relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-black/10 pb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/55">Fit Reference</p>
            <h2 className="mt-1 text-base font-semibold text-neutral-900">Kids Oversized Tee Size Guide</h2>
          </div>
          <button type="button" onClick={onClose} className="border border-black/15 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
            Close
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Soft oversized fit. Measure height and chest, then choose the closest age band. Prefer the larger size for a roomier drop-shoulder look.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs text-neutral-800 md:text-sm">
            <thead>
              <tr className="border-b border-black/10 text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                <th className="px-2 py-2 font-semibold">Size</th>
                <th className="px-2 py-2 font-semibold">Age</th>
                <th className="px-2 py-2 font-semibold">Height</th>
                <th className="px-2 py-2 font-semibold">Chest</th>
              </tr>
            </thead>
            <tbody>
              {KIDS_SIZE_GUIDE_ROWS.map((row) => (
                <tr key={row.size} className="border-b border-black/5">
                  <td className="px-2 py-2.5 font-semibold">{row.size}</td>
                  <td className="px-2 py-2.5">{row.age}</td>
                  <td className="px-2 py-2.5">
                    {row.heightIn}
                    <span className="block text-neutral-500">{row.heightCm}</span>
                  </td>
                  <td className="px-2 py-2.5">
                    {row.chestIn}
                    <span className="block text-neutral-500">{row.chestCm}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
