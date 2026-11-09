// Contact HH - Preloaded Sample Database
// Contains correct records, duplicate anomalies, format errors, and social platform mapping details.

export const INITIAL_CONTACTS = [
  // Tunisia (+216)
  {
    id: "tn-1",
    name: "Hamza HH",
    phone: "+216 22 123 456",
    email: "hamza.hh@google.com",
    birthday: "1997-09-12",
    address: "Les Berges du Lac, Tunis, Tunisia",
    countryCode: "TN",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    social: { whatsapp: true, telegram: true, facebook: true, instagram: true },
    isGoogleSynced: false
  },
  {
    id: "tn-2",
    name: "Yassine Benz",
    phone: "+216 98 765 432",
    email: "yassine.benz@gmail.com",
    birthday: "1994-04-20",
    address: "Sousse, Tunisia",
    countryCode: "TN",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    social: { whatsapp: true, telegram: true, facebook: false, instagram: false },
    isGoogleSynced: false
  },
  {
    id: "tn-3",
    name: "Emna Trabelsi",
    phone: "+216 55 443 322",
    email: "emna.trabelsi@yahoo.com",
    birthday: "1998-05-18",
    address: "Ariana, Tunis, Tunisia",
    countryCode: "TN",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    social: { whatsapp: true, telegram: false, facebook: true, instagram: true },
    isGoogleSynced: false
  },
  
  // France (+33)
  {
    id: "fr-1",
    name: "Jean Dupont",
    phone: "+33 6 1234 5678",
    email: "jean.dupont@orange.fr",
    birthday: "1988-11-05",
    address: "12 Rue de la Paix, Paris, France",
    countryCode: "FR",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    social: { whatsapp: true, telegram: true, facebook: true, instagram: false },
    isGoogleSynced: false
  },
  {
    id: "fr-2",
    name: "Sophie Laurent",
    phone: "+33 7 9876 5432",
    email: "sophie.laurent@gmail.com",
    birthday: "1993-02-14",
    address: "Lyon, France",
    countryCode: "FR",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
    social: { whatsapp: true, telegram: false, facebook: false, instagram: true },
    isGoogleSynced: false
  },

  // Algeria (+213)
  {
    id: "dz-1",
    name: "Riad Mahrez",
    phone: "+213 661 234 567",
    email: "riad.mahrez@dz-mail.com",
    birthday: "1991-02-21",
    address: "Algiers, Algeria",
    countryCode: "DZ",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
    social: { whatsapp: true, telegram: true, facebook: true, instagram: true },
    isGoogleSynced: false
  },

  // USA (+1)
  {
    id: "us-1",
    name: "John Smith",
    phone: "+1 202 555 0143",
    email: "jsmith@outlook.com",
    birthday: "1985-07-30",
    address: "1600 Pennsylvania Ave NW, Washington, DC, USA",
    countryCode: "US",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
    social: { whatsapp: false, telegram: true, facebook: true, instagram: true },
    isGoogleSynced: false
  },

  // --- ANOMALIES FOR DUPLICATES & FIXER TAB ---
  
  // Duplicate Anomaly 1: Exact Number Duplication, Name Mismatch
  {
    id: "tn-dup-1a",
    name: "Yassine Benz",
    phone: "+216 98 765 432",
    email: "yassine.b@gmail.com",
    birthday: "",
    address: "",
    countryCode: "TN",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    social: { whatsapp: true, telegram: true, facebook: false, instagram: false },
    isGoogleSynced: false
  },
  {
    id: "tn-dup-1b",
    name: "Yassine Benz Work",
    phone: "+216 98 765 432",
    email: "benz.office@company.tn",
    birthday: "",
    address: "",
    countryCode: "TN",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    social: { whatsapp: true, telegram: true, facebook: false, instagram: false },
    isGoogleSynced: false
  },

  // Duplicate Anomaly 2: Fuzzy match with different representation
  {
    id: "tn-dup-2",
    name: "Hamza Contact",
    phone: "22 123 456",
    email: "hamza@hh.tn",
    birthday: "",
    address: "",
    countryCode: "TN",
    avatar: "",
    social: { whatsapp: true, telegram: true, facebook: false, instagram: false },
    isGoogleSynced: false
  },

  // Invalid Numbers Anomaly 1: Missing Country Prefix for French number (starting with 06)
  {
    id: "bad-num-1",
    name: "Marc Duboi",
    phone: "06 43 21 09 87",
    email: "marc.duboi@yahoo.fr",
    birthday: "",
    address: "",
    countryCode: "FR",
    avatar: "",
    social: { whatsapp: false, telegram: false, facebook: false, instagram: false },
    isGoogleSynced: false
  },

  // Invalid Numbers Anomaly 2: Incorrect length (Tunisian number with 7 digits instead of 8)
  {
    id: "bad-num-2",
    name: "Selim Feriani",
    phone: "+216 99 123 45",
    email: "selim.f@telecom.tn",
    birthday: "",
    address: "",
    countryCode: "TN",
    avatar: "",
    social: { whatsapp: false, telegram: false, facebook: false, instagram: false },
    isGoogleSynced: false
  }
];

// High-quality profile photos on Unsplash categorized by social profiles to fetch during Social Pfp Syncing
export const PREMIUM_SOCIAL_AVATARS = {
  whatsapp: [
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200"
  ],
  telegram: [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200"
  ],
  facebook: [
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"
  ],
  instagram: [
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=200"
  ]
};

// Mock Google Contacts to import
export const GOOGLE_CONTACTS_MOCK = [
  {
    name: "Amine Ghozzi",
    phone: "+216 23 999 888",
    email: "amine.ghozzi@google.com",
    birthday: "1995-10-10",
    address: "Tunis, Tunisia",
    countryCode: "TN",
    avatar: "",
    social: { whatsapp: true, telegram: true, facebook: true, instagram: false }
  },
  {
    name: "Clara Martin",
    phone: "+33 6 8888 7777",
    email: "clara.martin@gmail.com",
    birthday: "1992-06-25",
    address: "Nice, France",
    countryCode: "FR",
    avatar: "",
    social: { whatsapp: true, telegram: false, facebook: true, instagram: true }
  },
  {
    name: "Karim Ziani",
    phone: "+213 555 444 333",
    email: "ziani.karim@dz.com",
    birthday: "1989-12-14",
    address: "Oran, Algeria",
    countryCode: "DZ",
    avatar: "",
    social: { whatsapp: true, telegram: true, facebook: false, instagram: false }
  },
  {
    name: "Sarah Miller",
    phone: "+1 415 555 2671",
    email: "sarah.m@gmail.com",
    birthday: "1994-08-08",
    address: "San Francisco, CA, USA",
    countryCode: "US",
    avatar: "",
    social: { whatsapp: false, telegram: true, facebook: true, instagram: true }
  },
  {
    name: "Aymen HH",
    phone: "+216 22 123 456",
    email: "aymen.hh@gmail.com",
    birthday: "1996-03-05",
    address: "La Marsa, Tunis, Tunisia",
    countryCode: "TN",
    avatar: "",
    social: { whatsapp: true, telegram: true, facebook: true, instagram: true }
  }
];
