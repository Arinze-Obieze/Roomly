import { 
  MdHome, 
  MdApartment, 
  MdBedroomParent, 
  MdPerson, 
  MdGroup,
  MdVpnKey,
  MdDirectionsBus,
  MdTrain,
  MdDirectionsSubway,
  MdDirectionsWalk,
  MdSchool,
  MdWork,
  MdWbSunny,
  MdPets,
  MdLocalLaundryService,
  MdWifi,
  MdKitchen
} from 'react-icons/md';

export const USER_ROLES = [
  { value: 'live_in_landlord', label: 'Live-in Landlord' },
  { value: 'live_out_landlord', label: 'Live-out Landlord' },
  { value: 'current_tenant', label: 'Current Tenant (subletting)' },
  { value: 'agent', label: 'Agent/Property Manager' },
];

export const RENTAL_TYPES = [
  { value: 'monthly', label: 'Monthly Rolling', description: 'Flexible month-to-month' },
  { value: 'fixed', label: 'Fixed Term', description: 'Lease for a set period' },
  { value: 'short', label: 'Short Term', description: 'Less than 6 months' },
];

export const PROPERTY_CATEGORIES = [
  { value: 'apartment', label: 'Apartment/Flat', icon: MdApartment },
  { value: 'house', label: 'House', icon: MdHome },
  { value: 'studio', label: 'Studio', icon: MdBedroomParent },
  { value: 'duplex', label: 'Duplex', icon: MdApartment },
  { value: 'townhouse', label: 'Townhouse', icon: MdHome },
  { value: 'bungalow', label: 'Bungalow', icon: MdHome },
  { value: 'penthouse', label: 'Penthouse', icon: MdApartment },
  { value: 'detached', label: 'Detached House', icon: MdHome },
  { value: 'semi_detached', label: 'Semi-Detached House', icon: MdHome },
  { value: 'terrace', label: 'Terrace House', icon: MdHome },
];

export const OFFERING_TYPES = [
  { value: 'private_room', label: 'Private Room', description: 'Your own private bedroom', icon: MdVpnKey },
  { value: 'shared_room', label: 'Shared Room', description: 'Share a bedroom with others', icon: MdGroup },
  { value: 'entire_place', label: 'Entire Place', description: 'The whole property to yourself', icon: MdHome },
];

export const TRANSPORT_OPTIONS = [
  { value: 'dart', label: 'DART Station', icon: MdTrain },
  { value: 'luas_green', label: 'LUAS Green', icon: MdDirectionsSubway },
  { value: 'luas_red', label: 'LUAS Red', icon: MdDirectionsSubway },
  { value: 'bus', label: 'Bus Stop', icon: MdDirectionsBus },
  { value: 'dublmbikes', label: 'Dublin Bikes', icon: MdDirectionsWalk },
];

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'revolut', label: 'Revolut' },
  { value: 'cash', label: 'Cash' },
  { value: 'paypal', label: 'PayPal' },
];

export const OCCUPATION_PREFERENCES = [
  { value: 'student', label: 'Students', icon: MdSchool },
  { value: 'professional', label: 'Professionals', icon: MdWork },
  { value: 'mixed', label: 'Mixed', icon: MdGroup },
];

export const GENDER_PREFERENCES = [
  { value: 'any', label: 'Any' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

export const LIFESTYLE_PRIORITIES = [
  { id: 'cleanliness', label: 'Cleanliness' },
  { id: 'social', label: 'Socializing' },
  { id: 'quiet', label: 'Quiet Time' },
  { id: 'guests', label: 'Guests' },
  { id: 'sleep', label: 'Sleep Schedule' },
];

export const AMENITY_GROUPS = [
  {
    title: 'Essentials',
    items: [
      { id: 'wifi', label: 'WiFi', icon: MdWifi },
      { id: 'washing_machine', label: 'Washing Machine', icon: MdLocalLaundryService },
      { id: 'kitchen', label: 'Kitchen', icon: MdKitchen },
      { id: 'heating', label: 'Heating', icon: MdWbSunny },
    ]
  },
  {
    title: 'Lifestyle',
    items: [
      { id: 'pets', label: 'Pet Friendly', icon: MdPets },
      { id: 'garden', label: 'Garden', icon: MdHome },
      { id: 'parking', label: 'Parking', icon: MdDirectionsBus },
    ]
  }
];

export const DEAL_BREAKERS = [
  { id: 'smokers', label: 'Smokers' },
  { id: 'couples', label: 'Couples' },
  { id: 'pets', label: 'Pets' },
  { id: 'night_workers', label: 'Night Workers' },
  { id: 'students', label: 'Students' },
  { id: 'no_full_time_job', label: 'No Full-time Job' },
  { id: 'no_references', label: 'No References' },
];
