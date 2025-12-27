
import { Venue, UserPreferences, UserProfile, MenuItem, TimeBlock } from '../types';

/**
 * Normalizes a string by converting to lowercase and removing all non-alphanumeric characters.
 * Used for robust matching between venue names and menu item slugs.
 */
export const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

export const parseCSV = (csvText: string): Venue[] => {
  const lines = csvText.trim().split('\n');
  
  const splitCSVLine = (str: string) => {
    const result = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '"' && str[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const getDriveDirectImageUrl = (url: string): string => {
    if (!url) return '';
    const match = url.match(/[-\w]{25,}/);
    if (match && url.includes('drive.google.com')) {
      return `https://lh3.googleusercontent.com/d/${match[0]}`;
    }
    return url;
  };

  const getDriveEmbedUrl = (url: string): string => {
    if (!url) return '';
    const match = url.match(/[-\w]{25,}/);
    if (match && url.includes('drive.google.com')) {
      return `https://drive.google.com/file/d/${match[0]}/preview`;
    }
    return url;
  };

  const cleanPrefix = (str: string, venueName: string): string => {
    if (!str) return '';
    const prefix = `${venueName},`;
    if (str.startsWith(prefix)) {
      return str.substring(prefix.length).trim().replace(/^"+/, '').replace(/"+$/, '');
    }
    if (str.includes(',')) {
      const parts = str.split(',');
      if (parts[0].trim().toLowerCase() === venueName.trim().toLowerCase()) {
        return parts.slice(1).join(',').trim().replace(/^"+/, '').replace(/"+$/, '');
      }
    }
    return str.replace(/^"+/, '').replace(/"+$/, '');
  };

  const venues: Venue[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitCSVLine(lines[i]);
    if (row.length < 5) continue;

    try {
      const venueName = row[1];
      const imageLink = getDriveDirectImageUrl(row[3]);
      const menuLink = getDriveEmbedUrl(row[4]);
      
      const romantic = parseInt(row[21] || '0');
      const party = parseInt(row[22] || '0');
      const insta = parseInt(row[23] || '0');
      const rawScore = romantic + party + insta;
      const googleRating = parseFloat((3.8 + (rawScore / 20) * 1.1).toFixed(1));

      venues.push({
        id: row[0],
        name: venueName,
        googleLocationUrl: row[2],
        imageAddress: imageLink,
        menuLink: menuLink,
        contactNumber: row[5],
        type: row[8],
        location: row[9],
        commission: parseFloat(row[10]?.replace(/[^0-9.]/g, '') || '0'),
        familyFriendly: (row[11] || '').toLowerCase().includes('yes'),
        cuisine: row[12],
        openingHours: row[13],
        daysClosed: [],
        availability: row[14],
        pricePerPerson: parseFloat((row[15] || '0').replace(/[^0-9]/g, '')),
        promoVenue: (row[17] || '').length > 0 && !row[17].toLowerCase().includes('no'),
        signatureDish: cleanPrefix(row[18], venueName),
        highTrafficArea: (row[19] || '').toLowerCase().includes('yes'),
        loudness: parseInt(row[20] || '0'),
        romanticScore: romantic,
        partyVibe: party,
        instagrammable: insta,
        sunsetView: (row[24] || '').toLowerCase().includes('yes'),
        indoorOutdoor: (row[25] || 'Unknown') as any,
        bestTimeToArrive: '',
        businessFriendly: (row[26] || '').toLowerCase().includes('yes'),
        dressCode: cleanPrefix(row[27], venueName),
        birthdayVenue: (row[28] || '').toLowerCase().includes('yes'),
        usp: cleanPrefix(row[29], venueName),
        notes: '',
        extraDetails: row[30],
        googleRating: googleRating > 5 ? 5.0 : googleRating
      });
    } catch (e) {
      console.warn("Failed to parse row", i, e);
    }
  }
  return venues;
};

export const parseMenuItems = (csvText: string, venues: Venue[]): MenuItem[] => {
  const lines = csvText.trim().split('\n');
  const items: MenuItem[] = [];

  const splitCSVLine = (str: string) => {
    const result = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '"' && str[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  for (let i = 1; i < lines.length; i++) {
    const row = splitCSVLine(lines[i]);
    if (row.length < 5) continue;

    const venueSlug = row[0];
    const normSlug = normalize(venueSlug);
    
    const matchingVenue = venues.find(v => normalize(v.name) === normSlug);

    if (matchingVenue) {
      items.push({
        id: `m-${i}`,
        venueSlug: venueSlug,
        course: row[1],
        item: row[2],
        description: row[3],
        price: parseFloat(row[4]) || 0,
        dietaryTags: (row[5] || '').split(';').map(t => t.trim()).filter(Boolean),
        venueName: matchingVenue.name,
        venueImage: matchingVenue.imageAddress
      });
    }
  }
  return items;
};

export const parseTimeToMinutes = (timeStr: string) => {
  let hours = 0;
  let minutes = 0;
  const isPM = timeStr.toLowerCase().includes('pm');
  const isAM = timeStr.toLowerCase().includes('am');
  
  let timePart = timeStr.replace(/am|pm/gi, '').trim();
  if (timePart.includes(':')) {
    const [h, m] = timePart.split(':').map(Number);
    hours = h;
    minutes = m;
  } else {
    hours = Number(timePart);
  }

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
};

export const getDubaiTime = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 4));
};

export const generateTimeSlots = (openingHours: string): string[] => {
  const slots: string[] = [];
  
  const startMinLimit = 720; // 12 PM
  const endMinLimit = 1440 + 120; // 02 AM (next day)

  if (!openingHours || openingHours.toLowerCase().includes('all opening hours')) {
    for (let m = startMinLimit; m <= endMinLimit; m += 30) {
      const displayMin = m % (24 * 60);
      const h = Math.floor(displayMin / 60);
      const min = displayMin % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      slots.push(`${h12}:${min.toString().padStart(2, '0')} ${ampm}`);
    }
    return slots;
  }

  const cleanHours = openingHours.replace(/[–—]/g, '-').replace(/\s/g, '');
  const parts = cleanHours.split('-');
  if (parts.length !== 2) return ["7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM"];

  try {
    let startMin = parseTimeToMinutes(parts[0]);
    let endMin = parseTimeToMinutes(parts[1]);

    if (endMin <= startMin) endMin += 24 * 60;

    for (let m = startMin; m <= endMin; m += 30) {
      const displayMin = m % (24 * 60);
      const h = Math.floor(displayMin / 60);
      const min = displayMin % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      slots.push(`${h12}:${min.toString().padStart(2, '0')} ${ampm}`);
    }
    return slots;
  } catch (e) {
    return ["7:00 PM", "8:00 PM", "9:00 PM"];
  }
};

export const generateTwoHourWindows = (openingHours: string): TimeBlock[] => {
  const startMinLimit = 720; // 12 PM
  const endMinLimit = 1440 + 120; // 02 AM (next day)

  if (!openingHours || openingHours.toLowerCase().includes('all opening hours') || openingHours.toLowerCase().includes('24 hours')) {
    const blocks: TimeBlock[] = [];
    for (let m = startMinLimit; m < endMinLimit; m += 120) {
      const formatTime = (minTotal: number) => {
        const displayMin = minTotal % (24 * 60);
        const h = Math.floor(displayMin / 60);
        const mn = displayMin % 60;
        return `${h.toString().padStart(2, '0')}:${mn.toString().padStart(2, '0')}`;
      };
      const start = formatTime(m);
      const end = formatTime(m + 120);
      blocks.push({ start, end, label: `${start} - ${end}` });
    }
    return blocks;
  }

  const cleanHours = openingHours.replace(/[–—]/g, '-').replace(/\s/g, '');
  const parts = cleanHours.split('-');
  if (parts.length !== 2) return [];

  try {
    let startMin = parseTimeToMinutes(parts[0]);
    let endMin = parseTimeToMinutes(parts[1]);

    if (endMin <= startMin) endMin += 24 * 60;

    const blocks: TimeBlock[] = [];
    for (let m = startMin; m < endMin; m += 120) {
      const nextBlockEnd = m + 120;
      if (nextBlockEnd > endMin) break;

      const formatTime = (minTotal: number) => {
        const displayMin = minTotal % (24 * 60);
        const h = Math.floor(displayMin / 60);
        const mn = displayMin % 60;
        return `${h.toString().padStart(2, '0')}:${mn.toString().padStart(2, '0')}`;
      };

      const start = formatTime(m);
      const end = formatTime(nextBlockEnd);
      blocks.push({ start, end, label: `${start} - ${end}` });
    }
    return blocks;
  } catch (e) {
    return [];
  }
};

export const getVenueStatus = (openingHours: string, availability?: string): string | null => {
  const checkStr = (openingHours + ' ' + (availability || '')).toLowerCase();
  if (checkStr.includes('all opening hours') || checkStr.includes('24 hours') || checkStr.includes('open now')) {
    return 'Open Now';
  }

  const cleanHours = openingHours.replace(/[–—]/g, '-').replace(/\s/g, '');
  const parts = cleanHours.split('-');
  
  if (parts.length !== 2) {
    if (checkStr.includes('always open')) return 'Open Now';
    return null;
  }

  try {
    const dubaiTime = getDubaiTime();
    const currentMin = dubaiTime.getHours() * 60 + dubaiTime.getMinutes();
    
    let startMin = parseTimeToMinutes(parts[0]);
    let endMin = parseTimeToMinutes(parts[1]);

    let isOpen = false;
    if (endMin <= startMin) {
      if (currentMin >= startMin || currentMin < endMin) isOpen = true;
    } else {
      if (currentMin >= startMin && currentMin < endMin) isOpen = true;
    }

    if (isOpen) return 'Open Now';

    const minutesToOpening = (startMin - currentMin + 1440) % 1440;
    if (minutesToOpening <= 60 && minutesToOpening > 0) return 'Opening soon';

    return 'Closed';
  } catch (e) {
    return null;
  }
};

export const filterAndRankVenues = (venues: Venue[], prefs: UserPreferences, profile?: UserProfile): { scored: Venue[], matchReason: Record<string, string> } => {
  if (prefs.venueName) {
    const target = prefs.venueName.toLowerCase().trim();
    const matches = venues.filter(v => 
      v.name.toLowerCase().includes(target) || 
      target.includes(v.name.toLowerCase())
    );
    if (matches.length > 0) {
      return { scored: matches, matchReason: matches.reduce((acc, v) => ({ ...acc, [v.id]: "Requested Venue" }), {}) };
    }
  }

  const MATCH_BOOST = 100000;
  
  const scored = venues.map(v => {
    let score = 0;
    
    if (profile && profile.dislikes && profile.dislikes.some(d => v.cuisine.toLowerCase().includes(d.toLowerCase()))) {
        score -= 500000;
    }

    if (prefs.area) {
        const targetArea = prefs.area.toLowerCase().trim();
        const venueLoc = v.location.toLowerCase().trim();
        const venueName = v.name.toLowerCase().trim();
        const venueUrl = v.googleLocationUrl.toLowerCase();
        
        if (venueLoc.includes(targetArea) || targetArea.includes(venueLoc) || 
            venueName.includes(targetArea) || targetArea.includes(venueName) ||
            venueUrl.includes(targetArea)) {
            score += MATCH_BOOST;
        } else {
            score -= (MATCH_BOOST / 2);
        }
    }

    if (prefs.mealType === 'lunch') {
        const start = parseTimeToMinutes(v.openingHours.split('-')[0] || '0');
        if (start <= 870) score += 5000;
        else score -= 10000;
    }

    if (prefs.vibe?.romantic) {
        if (v.romanticScore >= 8) score += 8000;
        else score += (v.romanticScore * 100);
    }
    if (prefs.vibe?.party) {
        if (v.partyVibe >= 4) score += 8000;
        else score += (v.partyVibe * 500);
    }
    if (prefs.vibe?.instagrammable) {
        score += (v.instagrammable * 500);
    }

    if (prefs.cuisine && prefs.cuisine.length > 0) {
        if (prefs.cuisine.some(c => v.cuisine.toLowerCase().includes(c.toLowerCase()))) {
            score += 2000;
        }
    }

    if (prefs.budget) {
       if (v.pricePerPerson <= prefs.budget) score += 500;
       else score -= 200;
    }

    score += (v.googleRating * 20);

    return { ...v, _score: score };
  });

  let results = scored.sort((a, b) => b._score - a._score);

  if (prefs.area) {
    const areaSet = results.filter(v => v._score > 0);
    if (areaSet.length > 0) results = areaSet;
  }

  const reasons: Record<string, string> = {};
  results.forEach(v => {
      const matchDetails: string[] = [];
      if (prefs.area && v.location.toLowerCase().includes(prefs.area.toLowerCase())) matchDetails.push(`Match: ${v.location}`);
      if (prefs.vibe?.romantic && v.romanticScore >= 8) matchDetails.push('Ultra-Romantic');
      if (prefs.vibe?.party && v.partyVibe >= 4) matchDetails.push('High Energy');
      reasons[v.id] = matchDetails.slice(0, 2).join(' • ') || v.usp;
  });

  return { scored: results, matchReason: reasons };
};
