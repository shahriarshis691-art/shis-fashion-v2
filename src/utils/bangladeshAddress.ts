export const bangladeshDivisions = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
] as const

export type BangladeshDivision = (typeof bangladeshDivisions)[number]

export const bangladeshDistrictsByDivision: Record<BangladeshDivision, string[]> = {
  Dhaka: ['Dhaka', 'Gazipur', 'Narsingdi', 'Narayanganj', 'Munshiganj', 'Kishoreganj', 'Tangail', 'Manikganj', 'Faridpur', 'Gopalganj', 'Madaripur', 'Rajbari', 'Shariatpur'],
  Chattogram: ['Chattogram', "Cox's Bazar", 'Cumilla', 'Noakhali', 'Feni', 'Lakshmipur', 'Chandpur', 'Brahmanbaria', 'Rangamati', 'Khagrachhari', 'Bandarban'],
  Rajshahi: ['Rajshahi', 'Bogura', 'Pabna', 'Sirajganj', 'Naogaon', 'Natore', 'Chapai Nawabganj', 'Joypurhat'],
  Khulna: ['Khulna', 'Bagerhat', 'Satkhira', 'Jashore', 'Jhenaidah', 'Magura', 'Kushtia', 'Chuadanga', 'Meherpur'],
  Barishal: ['Barishal', 'Patuakhali', 'Bhola', 'Jhalokathi', 'Pirojpur', 'Barguna'],
  Sylhet: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  Rangpur: ['Rangpur', 'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon'],
  Mymensingh: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'],
}

export interface DeliveryAddress {
  division: BangladeshDivision
  district: string
  upazila?: string
  streetAddress: string
  deliveryNote?: string
}

const allDistricts = Object.values(bangladeshDistrictsByDivision).flat()

const curatedUpazilasByDistrict: Partial<Record<string, string[]>> = {
  Dhaka: [
    'Dhanmondi',
    'Gulshan',
    'Banani',
    'Uttara',
    'Mirpur',
    'Mohammadpur',
    'Badda',
    'Rampura',
    'Khilgaon',
    'Shahbagh',
    'Ramna',
    'Motijheel',
    'Paltan',
    'Wari',
    'Lalbagh',
    'Jatrabari',
    'Demra',
    'Tejgaon',
    'Kafrul',
    'Cantonment',
    'Adabor',
    'Dhamrai',
    'Dohar',
    'Keraniganj',
    'Nawabganj',
    'Savar',
  ],
  Gazipur: ['Gazipur Sadar', 'Kaliakair', 'Kaliganj', 'Kapasia', 'Sreepur'],
  Narayanganj: ['Araihazar', 'Bandar', 'Narayanganj Sadar', 'Rupganj', 'Sonargaon'],
  Kishoreganj: ['Austagram', 'Bajitpur', 'Bhairab', 'Hossainpur', 'Itna', 'Karimganj', 'Katiadi', 'Kishoreganj Sadar', 'Kuliarchar', 'Mithamain', 'Nikli', 'Pakundia', 'Tarail'],
  Tangail: ['Basail', 'Bhuapur', 'Delduar', 'Dhanbari', 'Ghatail', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur', 'Tangail Sadar'],
  Faridpur: ['Alfadanga', 'Bhanga', 'Boalmari', 'Charbhadrasan', 'Faridpur Sadar', 'Madhukhali', 'Nagarkanda', 'Sadarpur', 'Saltha'],
  Chattogram: ['Anwara', 'Banshkhali', 'Boalkhali', 'Chandanaish', 'Fatikchhari', 'Hathazari', 'Lohagara', 'Mirsharai', 'Patiya', 'Rangunia', 'Raozan', 'Sandwip', 'Satkania', 'Sitakunda'],
  "Cox's Bazar": ['Chakaria', "Cox's Bazar Sadar", 'Kutubdia', 'Maheshkhali', 'Pekua', 'Ramu', 'Teknaf', 'Ukhia'],
  Cumilla: ['Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Cumilla Adarsha Sadar', 'Cumilla Sadar Dakshin', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Meghna', 'Monoharganj', 'Muradnagar', 'Nangalkot', 'Titas'],
  Noakhali: ['Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Kabirhat', 'Noakhali Sadar', 'Senbagh', 'Sonaimuri', 'Subarnachar'],
  Rajshahi: ['Bagha', 'Bagmara', 'Charghat', 'Durgapur', 'Godagari', 'Mohanpur', 'Paba', 'Puthia', 'Tanore'],
  Bogura: ['Adamdighi', 'Bogura Sadar', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Sherpur', 'Shibganj', 'Sonatola'],
  Khulna: ['Batiaghata', 'Dacope', 'Dighalia', 'Dumuria', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsa', 'Terokhada'],
  Satkhira: ['Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Satkhira Sadar', 'Shyamnagar', 'Tala'],
  Jashore: ['Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jashore Sadar', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha'],
  Barishal: ['Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Barishal Sadar', 'Gournadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur'],
  Sylhet: ['Balaganj', 'Beanibazar', 'Bishwanath', 'Companiganj', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Osmani Nagar', 'Sylhet Sadar', 'Zakiganj'],
  Rangpur: ['Badarganj', 'Gangachara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Rangpur Sadar', 'Taraganj'],
  Dinajpur: ['Biral', 'Birampur', 'Birganj', 'Bochaganj', 'Chirirbandar', 'Dinajpur Sadar', 'Fulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'],
  Lalmonirhat: ['Aditmari', 'Hatibandha', 'Kaliganj', 'Lalmonirhat Sadar', 'Patgram'],
  Mymensingh: ['Bhaluka', 'Dhobaura', 'Fulbaria', 'Gaffargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Mymensingh Sadar', 'Muktagachha', 'Nandail', 'Phulpur', 'Trishal'],
}

const bangladeshUpazilasByDistrict = allDistricts.reduce<Record<string, string[]>>((accumulator, district) => {
  accumulator[district] = curatedUpazilasByDistrict[district] ?? [`${district} Sadar`]
  return accumulator
}, {})

export function getDistrictsForDivision(division: BangladeshDivision) {
  return bangladeshDistrictsByDivision[division]
}

export function getUpazilasForDistrict(district: string) {
  return bangladeshUpazilasByDistrict[district] ?? [`${district} Sadar`]
}

export const DEFAULT_FREE_DELIVERY_THRESHOLD = 3000
export const DHAKA_DELIVERY_CHARGE = 80
export const OUTSIDE_DHAKA_DELIVERY_CHARGE = 130

export function normalizeFreeDeliveryThreshold(value: unknown) {
  const numericValue = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_FREE_DELIVERY_THRESHOLD
  }

  return Math.max(0, Math.round(numericValue))
}

export function getBaseDeliveryCharge(division: BangladeshDivision) {
  return division === 'Dhaka' ? DHAKA_DELIVERY_CHARGE : OUTSIDE_DHAKA_DELIVERY_CHARGE
}

export function getDeliveryCharge(
  division: BangladeshDivision,
  subtotal = 0,
  freeDeliveryThreshold: unknown = DEFAULT_FREE_DELIVERY_THRESHOLD,
) {
  const threshold = normalizeFreeDeliveryThreshold(freeDeliveryThreshold)
  if (threshold > 0 && subtotal >= threshold) {
    return 0
  }

  return getBaseDeliveryCharge(division)
}

export function getAmountToFreeDelivery(
  subtotal: number,
  freeDeliveryThreshold: unknown = DEFAULT_FREE_DELIVERY_THRESHOLD,
) {
  const threshold = normalizeFreeDeliveryThreshold(freeDeliveryThreshold)
  if (threshold <= 0) {
    return 0
  }

  return Math.max(0, threshold - subtotal)
}

export function normalizeBangladeshPhone(raw: string) {
  const digits = raw.replace(/\D/g, '')

  if (!digits) {
    return null
  }

  if (digits.startsWith('8801') && digits.length === 13) {
    return `0${digits.slice(3)}`
  }

  if (digits.startsWith('01') && digits.length === 11) {
    return digits
  }

  return null
}

export function formatBangladeshPhoneInput(raw: string) {
  const digits = raw.replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  if (digits.startsWith('8801')) {
    return `0${digits.slice(3).slice(0, 10)}`
  }

  if (digits.startsWith('88')) {
    return `0${digits.slice(2).slice(0, 10)}`
  }

  if (digits.startsWith('01')) {
    return digits.slice(0, 11)
  }

  if (digits.length === 10) {
    return `0${digits}`
  }

  return digits.slice(0, 11)
}
