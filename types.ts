
export interface Venue {
  id: string;
  name: string;
  googleLocationUrl: string;
  imageAddress: string;
  contactNumber: string;
  type: string;
  location: string;
  commission: number;
  familyFriendly: boolean;
  cuisine: string;
  openingHours: string;
  daysClosed: string[];
  availability: string;
  pricePerPerson: number;
  promoVenue: boolean;
  signatureDish: string;
  highTrafficArea: boolean;
  loudness: number;
  romanticScore: number;
  partyVibe: number;
  instagrammable: number;
  sunsetView: boolean;
  indoorOutdoor: 'Indoor' | 'Outdoor' | 'Both' | 'Unknown';
  bestTimeToArrive: string;
  businessFriendly: boolean;
  dressCode: string;
  birthdayVenue: boolean;
  usp: string;
  menuLink: string;
  notes: string;
  extraDetails: string;
  googleRating: number;
}

export interface MenuItem {
  id: string;
  venueSlug: string;
  course: string;
  item: string;
  description: string;
  price: number;
  dietaryTags: string[];
  venueName?: string;
  venueImage?: string;
  isSoldOut?: boolean;
  isChefPick?: boolean;
  staffNotes?: string;
}

export interface PalateItem {
  id: string;
  images: string[];
  description: string;
  venue: string;
  date: string;
  category: 'dish' | 'menu' | 'atmosphere'; 
}

export interface CreditCard {
  id: string;
  cardholderName: string;
  lastFour: string;
  expiry: string;
  brand: string;
}

export interface Reservation {
  id: string;
  venueId: string;
  venueName: string;
  dateTime: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'no-show' | 'cancelled';
  rating?: number;
  feedback?: string;
  isCheckedIn?: boolean;
  orderedItems?: string[];
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  isVIP?: boolean;
  internalNotes?: string;
  source: 'app' | 'concierge' | 'walk-in';
  cancelReason?: string;
  specialRequests?: string;
}

export interface TimeBlock {
  start: string;
  end: string;
  label: string;
}

export interface VenueStaffState {
  venueId: string;
  blockedSlots: Record<string, string[]>; // key: "YYYY-MM-DD", value: array of labels e.g. ["12:00 - 14:00"]
  serviceNotes: string;
  soldOutItems: string[];
  chefPicks: string[];
  itemNotes: Record<string, string>;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  anniversary?: string;
  occupation?: string;
  company?: string;
  favouriteAreas: string[];
  defaultPartySize: number;
  dietaryRestrictions: string[];
  budgetRange: '200-350' | '350-600' | '600-1000' | '1000+';
  valueOrientation: 'value' | 'balanced' | 'wow';
  favoriteCuisines: string[];
  dislikes: string[]; 
  heroIngredients: string[]; 
  spiceTolerance: number; 
  palateSummary?: string;
  vibeLoudnessPreference: 'Quiet' | 'Balanced' | 'Lively'; 
  vibeRomanceImportance: number; 
  vibePartyImportance: number; 
  vibeInstagramImportance: number; 
  indoorOutdoorPreference: 'Indoor' | 'Outdoor' | 'Any';
  sunsetPreference: boolean;
  dressCodeComfort: 'Casual' | 'Smart Casual' | 'Smart Elegant' | 'Glam';
  tablePreference: 'Window' | 'Booth' | 'Quiet Corner' | 'Social Center' | 'Private' | 'Any';
  smokingPreference: 'Non-Smoking' | 'Smoking' | 'Cigar Lounge' | 'Any';
  bestTimePreference: string;
  adventurousness: 'Safe' | 'Balanced' | 'Wild';
  myPalate: PalateItem[];
  reservations: Reservation[];
  savedVenues: string[]; 
  binnedVenues: string[]; 
  savedDishes: string[]; 
  binnedDishes: string[]; 
  wallet?: CreditCard[];
}

export interface UserPreferences {
  when?: string;
  mealType?: 'lunch' | 'dinner' | 'breakfast' | 'any';
  partySize?: number;
  area?: string;
  venueName?: string;
  budget?: number;
  occasion?: 'date' | 'birthday' | 'business' | 'family' | 'party' | 'casual' | 'other';
  cuisine?: string[];
  venueTypes?: string[]; 
  vibe?: {
    loudness?: 'quiet' | 'lively' | 'any';
    romantic?: boolean;
    party?: boolean;
    instagrammable?: boolean;
  };
  sunset?: boolean;
  indoorOutdoor?: 'Indoor' | 'Outdoor' | 'Any';
  dressCodeComfort?: string;
  lookingForPromo?: boolean;
  userNotes?: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  suggestedVenues?: Venue[]; 
  isLiveTranscript?: boolean;
  isSystemConfirmation?: boolean; 
  image?: string; 
  isFeedbackRequest?: boolean;
  reservationId?: string;
}
