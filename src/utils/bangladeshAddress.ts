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
  streetAddress: string
  deliveryNote?: string
}

export function getDistrictsForDivision(division: BangladeshDivision) {
  return bangladeshDistrictsByDivision[division]
}

export function getDeliveryCharge(division: BangladeshDivision) {
  return division === 'Dhaka' ? 80 : 130
}
