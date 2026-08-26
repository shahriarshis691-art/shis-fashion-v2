export interface BrandContactLinks {
  website: string
  contact: string
}

export interface BrandEntry {
  id: string
  name: string
  tag: string
  summary: string
  details: string
  logo: string
  contacts: BrandContactLinks
}

export interface FounderSocialLinks {
  whatsapp: string
  facebook: string
  instagram: string
  email: string
}

export interface FounderProfile {
  name: string
  title: string
  image: string
  bio: string
  story: string
  socials: FounderSocialLinks
}

export interface SisterBrandStripItem {
  id: string
  name: string
  logo: string
  href: string
}

export const sisterBrandStrip: SisterBrandStripItem[] = [
  { id: 'velorix-motors', name: 'VELORIX MOTORS', logo: '/brands/velorix-motors.png', href: '/brands/velorix-motors' },
  { id: 'xeroxii', name: 'XEROXII', logo: '/brands/xeroxii.png', href: '/brands/xeroxii' },
]

export const brandEntries: BrandEntry[] = [
  {
    id: 'xeroxii',
    name: 'XEROXII',
    tag: 'Luxury Watch Brand',
    summary: 'Precision-crafted luxury watches with bold silhouettes and timeless detailing.',
    details: 'XEROXII focuses on statement timepieces with premium finishing for collectors and modern professionals.',
    logo: '/brands/xeroxii.png',
    contacts: {
      website: 'https://xeroxii.com',
      contact: 'https://wa.me/8801887848304?text=Hi%20XEROXII%2C%20I%20want%20to%20know%20more%20about%20your%20watches.',
    },
  },
  {
    id: 'ceravo',
    name: 'CERAVO',
    tag: 'Development Company',
    summary: 'Tiles, bath, and material solutions for premium residential and commercial spaces.',
    details: 'CERAVO delivers curated construction materials and interior surface solutions with design-first execution.',
    logo: '/brands/ceravo.png',
    contacts: {
      website: 'https://ceravo.com',
      contact: 'https://wa.me/8801887848304?text=Hi%20CERAVO%2C%20I%20want%20details%20about%20tiles%20and%20bath%20materials.',
    },
  },
  {
    id: 'rangkutir',
    name: 'RANGKUTIR',
    tag: 'Decorated Luxury Paints',
    summary: 'Decorative luxury paint experiences designed for high-end interiors and signature walls.',
    details: 'RANGKUTIR blends color science, texture artistry, and project consultation to create premium paint outcomes.',
    logo: '/brands/rangkutir.png',
    contacts: {
      website: 'https://rangkutir.com',
      contact: 'https://wa.me/8801887848304?text=Hi%20RANGKUTIR%2C%20I%20want%20consultation%20for%20luxury%20decorative%20paint.',
    },
  },
  {
    id: 'velorix-motors',
    name: 'VELORIX MOTORS',
    tag: 'Premium Mobility',
    summary: 'A refined mobility house for considered performance and contemporary design.',
    details: 'VELORIX MOTORS extends the group’s luxury language into vehicles and motion, with the same focus on finish, trust, and presence.',
    logo: '/brands/velorix-motors.png',
    contacts: {
      website: 'https://velorixmotors.com',
      contact: 'https://wa.me/8801887848304?text=Hi%20VELORIX%20MOTORS%2C%20I%20want%20to%20know%20more.',
    },
  },
]

export const founderProfile: FounderProfile = {
  name: 'SM Shahriar Walid',
  title: 'Founder and Vision Lead',
  image: '/brands/founder-walid.jpg',
  bio: 'Building connected premium brands across fashion, lifestyle products, and design-led development.',
  story: 'From product detail to customer experience, the focus is simple: create trusted brands with strong design identity and dependable service.',
  socials: {
    whatsapp: 'https://wa.me/8801887848304',
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    email: 'mailto:shahriarshis@gmail.com',
  },
}
