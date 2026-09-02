export const HALF_SHIRT_CROP_VIEWS = [
  {
    id: 'full',
    label: 'Full Look',
    scaleClass: 'scale-100',
    positionClass: 'object-[center_top]',
    originClass: 'origin-[50%_0%]',
  },
  {
    id: 'collar',
    label: 'Collar & Buttons',
    scaleClass: 'scale-[2.5]',
    positionClass: 'object-[50%_25%]',
    originClass: 'origin-[50%_25%]',
  },
  {
    id: 'texture',
    label: 'Fabric Texture',
    scaleClass: 'scale-[3.25]',
    positionClass: 'object-[50%_50%]',
    originClass: 'origin-center',
  },
] as const

export type HalfShirtCropView = (typeof HALF_SHIRT_CROP_VIEWS)[number]

export function getHalfShirtCropView(index: number): HalfShirtCropView {
  return HALF_SHIRT_CROP_VIEWS[index] ?? HALF_SHIRT_CROP_VIEWS[0]
}

export function halfShirtCropImageClass(index: number) {
  const view = getHalfShirtCropView(index)
  return `object-cover ${view.positionClass} ${view.scaleClass} ${view.originClass}`
}
