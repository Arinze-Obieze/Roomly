import { 
  FaWifi, 
  FaPaw, 
  FaCar, 
  FaDumbbell, 
  FaTv, 
  FaSnowflake,
  FaFire,
  FaTree,
  FaWheelchair,
  FaSmokingBan,
  FaDoorOpen,
  FaCouch,
  FaShower
} from 'react-icons/fa';

export const AMENITIES = [
  { value: 'wifi', label: 'WiFi', icon: FaWifi },
  { value: 'parking', label: 'Parking', icon: FaCar },
  { value: 'pets', label: 'Pets Allowed', icon: FaPaw },
  { value: 'gym', label: 'Gym', icon: FaDumbbell },
  { value: 'tv', label: 'TV', icon: FaTv },
  { value: 'ac', label: 'Air Con', icon: FaSnowflake },
  { value: 'heating', label: 'Heating', icon: FaFire },
  { value: 'garden', label: 'Garden', icon: FaTree },
  { value: 'ensuite', label: 'Ensuite', icon: FaShower },
  { value: 'wheelchair', label: 'Accessible', icon: FaWheelchair },
  { value: 'smoking', label: 'No Smoking', icon: FaSmokingBan },
  { value: 'private_entrance', label: 'Private Entry', icon: FaDoorOpen },
  { value: 'furnished', label: 'Furnished', icon: FaCouch },
];
