import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Users, 
  RefreshCw, 
  AlertTriangle, 
  Settings, 
  Trash2, 
  Edit3, 
  Phone, 
  Mail, 
  Check, 
  AlertCircle, 
  X, 
  ChevronRight, 
  Sparkles, 
  CheckCircle,
  ShieldAlert,
  Info,
  Save,
  Globe,
  Calendar,
  MapPin,
  MessageSquare,
  Send
} from 'lucide-react';
import { INITIAL_CONTACTS, GOOGLE_CONTACTS_MOCK, PREMIUM_SOCIAL_AVATARS } from './contactsData';
import { 
  isPhoneValid, 
  formatInternational, 
  getCountryDetails, 
  suggestPhoneCorrection, 
  parsePhone, 
  normalizeRawNumber, 
  COUNTRY_META 
} from './phoneUtils';

function App() {
  // --- Core State ---
  const [contacts, setContacts] = useState(() => {
    try {
      const saved = localStorage.getItem('contact_hh_list');
      return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
    } catch (e) {
      return INITIAL_CONTACTS;
    }
  });
  
  const [activeTab, setActiveTab] = useState('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('ALL');
  const [defaultCountry, setDefaultCountry] = useState(() => {
    try {
      return localStorage.getItem('contact_hh_default_country') || 'TN';
    } catch (e) {
      return 'TN';
    }
  });

  // --- Dynamic Theme Swapper ---
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('contact_hh_theme') || 'purple';
    } catch (e) {
      return 'purple';
    }
  });

  const [googleApiKey, setGoogleApiKey] = useState(() => {
    try {
      return localStorage.getItem('contact_hh_google_api_key') || '';
    } catch (e) {
      return '';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('contact_hh_theme', theme);
    } catch (e) {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('contact_hh_google_api_key', googleApiKey);
    } catch (e) {}
  }, [googleApiKey]);

  // --- Modal & Drawer States ---
  const [selectedContact, setSelectedContact] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ 
    id: '', name: '', phone: '', email: '', birthday: '', address: '', countryCode: '', avatar: '' 
  });
  const [addFormData, setAddFormData] = useState({ 
    name: '', phone: '', email: '', birthday: '', address: '', countryCode: '', avatar: '' 
  });

  // --- Sync State (Google Contacts) ---
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLogs, setSyncLogs] = useState([]);
  const terminalEndRef = useRef(null);

  // --- Fixer State ---
  const [fixerSubtab, setFixerSubtab] = useState('duplicates');
  const [notification, setNotification] = useState(null);

  // --- Save to localStorage ---
  useEffect(() => {
    try {
      localStorage.setItem('contact_hh_list', JSON.stringify(contacts));
    } catch (e) {}
  }, [contacts]);

  // --- Auto scroll sync logs ---
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [syncLogs]);

  // --- Notification Handler ---
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- Helper: Count contacts by country for Filter Badges ---
  const countryCounts = React.useMemo(() => {
    const counts = {};
    contacts.forEach(c => {
      const details = getCountryDetails(c.phone, defaultCountry);
      counts[details.iso] = (counts[details.iso] || 0) + 1;
    });
    return counts;
  }, [contacts, defaultCountry]);

  // --- Grouping & Alphabetical Sorting Logic ---
  const groupedContacts = React.useMemo(() => {
    // 1. Filter by Search Query
    let filtered = contacts.filter(c => {
      const nameMatch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const numMatch = normalizeRawNumber(c.phone).includes(normalizeRawNumber(searchQuery));
      return nameMatch || numMatch;
    });

    // 2. Filter by Country Badge Selection
    if (selectedCountryFilter !== 'ALL') {
      filtered = filtered.filter(c => {
        const details = getCountryDetails(c.phone, defaultCountry);
        return details.iso === selectedCountryFilter;
      });
    }

    // 3. Group by Country Name
    const groups = {};
    filtered.forEach(c => {
      const details = getCountryDetails(c.phone, defaultCountry);
      const groupKey = details.iso === 'UNKNOWN' ? 'Other Countries 🏳️' : `${details.name} ${details.flag}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(c);
    });

    // Sort groups alphabetically by country name
    const sortedGroups = {};
    Object.keys(groups).sort().forEach(key => {
      // Sort contacts inside group alphabetically by name
      sortedGroups[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    return sortedGroups;
  }, [contacts, searchQuery, selectedCountryFilter, defaultCountry]);

  // --- Action: Add Contact ---
  const handleAddContact = (e) => {
    e.preventDefault();
    if (!addFormData.name || !addFormData.phone) {
      showToast("Name and phone number are required!", "error");
      return;
    }

    // Guess or use selected country prefix
    let processedPhone = addFormData.phone;
    if (addFormData.countryCode && !addFormData.phone.trim().startsWith('+')) {
      const code = COUNTRY_META[addFormData.countryCode]?.code;
      const cleanNum = normalizeRawNumber(addFormData.phone);
      // Strip leading zero if present and add country prefix
      const stripped = cleanNum.startsWith('0') ? cleanNum.substring(1) : cleanNum;
      processedPhone = `${code} ${stripped}`;
    }

    const valid = isPhoneValid(processedPhone, defaultCountry);
    const formatted = formatInternational(processedPhone, defaultCountry);

    // Dynamic presence mapping
    const hasWA = Math.random() > 0.3;
    const hasTG = Math.random() > 0.4;
    const hasFB = Math.random() > 0.5;
    const hasIG = Math.random() > 0.5;

    // Append country flag + dial code to the contact name
    const detectedISO = addFormData.countryCode || getCountryDetails(formatted, defaultCountry).iso;
    const countryMeta = COUNTRY_META[detectedISO];
    const nameSuffix = countryMeta ? ` ${countryMeta.flag} ${countryMeta.code}` : '';
    const finalName = addFormData.name.trim() + nameSuffix;

    const newContact = {
      id: 'custom-' + Date.now(),
      name: finalName,
      phone: formatted,
      email: addFormData.email || '',
      birthday: addFormData.birthday || '',
      address: addFormData.address || '',
      countryCode: detectedISO,
      avatar: addFormData.avatar || '',
      social: { whatsapp: hasWA, telegram: hasTG, facebook: hasFB, instagram: hasIG },
      isGoogleSynced: false
    };

    setContacts(prev => [newContact, ...prev]);
    setIsAddOpen(false);
    setAddFormData({ name: '', phone: '', email: '', birthday: '', address: '', countryCode: '', avatar: '' });
    showToast(`${finalName} added successfully! ${!valid ? '⚠️ Check format in Fixer.' : ''}`);
  };

  // --- Action: Edit Contact ---
  const handleEditContact = (e) => {
    e.preventDefault();
    if (!editFormData.name || !editFormData.phone) return;

    let processedPhone = editFormData.phone;
    if (editFormData.countryCode && !editFormData.phone.trim().startsWith('+')) {
      const code = COUNTRY_META[editFormData.countryCode]?.code;
      const cleanNum = normalizeRawNumber(editFormData.phone);
      const stripped = cleanNum.startsWith('0') ? cleanNum.substring(1) : cleanNum;
      processedPhone = `${code} ${stripped}`;
    }

    const formatted = formatInternational(processedPhone, defaultCountry);

    setContacts(prev => prev.map(c => {
      if (c.id === editFormData.id) {
        return {
          ...c,
          name: editFormData.name,
          phone: formatted,
          email: editFormData.email,
          birthday: editFormData.birthday,
          address: editFormData.address,
          countryCode: editFormData.countryCode || getCountryDetails(formatted, defaultCountry).iso,
          avatar: editFormData.avatar
        };
      }
      return c;
    }));

    setIsEditOpen(false);
    // Update details overlay if active
    if (selectedContact && selectedContact.id === editFormData.id) {
      setSelectedContact(prev => ({
        ...prev,
        name: editFormData.name,
        phone: formatted,
        email: editFormData.email,
        birthday: editFormData.birthday,
        address: editFormData.address,
        countryCode: editFormData.countryCode || getCountryDetails(formatted, defaultCountry).iso,
        avatar: editFormData.avatar
      }));
    }
    showToast("Contact details updated!");
  };

  // --- Action: Delete Contact ---
  const handleDeleteContact = (id) => {
    const contactToDelete = contacts.find(c => c.id === id);
    if (!contactToDelete) return;
    
    if (confirm(`Are you sure you want to delete ${contactToDelete.name}?`)) {
      setContacts(prev => prev.filter(c => c.id !== id));
      setSelectedContact(null);
      showToast(`${contactToDelete.name} deleted.`);
    }
  };

  // --- Action: Google Sync Sequence ---
  const triggerGoogleSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncLogs([]);

    const logSteps = [
      { prg: 10, text: "🔑 Requesting Google OAuth2.0 Token... [contacts.readonly]" },
      { prg: 25, text: "🟢 Access Granted! Fetching user contact connections..." },
      { prg: 45, text: "📡 Received Google Contacts payload. Processing fields..." },
      { prg: 65, text: "🔍 Analyzing numbers: Tunisian numbers mapped, country codes adjusted." },
      { prg: 80, text: "⚡ Merging cloud metadata & checking duplicate records..." },
      { prg: 95, text: "💾 Writing 5 imported accounts to application database..." },
      { prg: 100, text: "🎉 Sync Complete! Added 5 new verified Google contacts." }
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      if (currentStepIndex < logSteps.length) {
        const step = logSteps[currentStepIndex];
        setSyncProgress(step.prg);
        setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step.text}`]);
        currentStepIndex++;
      } else {
        clearInterval(interval);
        
        // Actually merge Google Sync mock data
        setContacts(prev => {
          const currentPhones = prev.map(c => normalizeRawNumber(c.phone));
          const toAdd = GOOGLE_CONTACTS_MOCK.map((m, idx) => ({
            id: `google-${Date.now()}-${idx}`,
            name: m.name,
            phone: m.phone,
            email: m.email,
            birthday: m.birthday || '',
            address: m.address || '',
            countryCode: m.countryCode || getCountryDetails(m.phone, defaultCountry).iso,
            avatar: m.avatar,
            social: m.social,
            isGoogleSynced: true
          })).filter(g => !currentPhones.includes(normalizeRawNumber(g.phone)));

          return [...toAdd, ...prev];
        });

        setIsSyncing(false);
        showToast("Synced 5 new contacts from Google!");
      }
    }, 1100);
  };

  // --- Fixer: Scan and suggestions logic ---
  const duplicateGroups = React.useMemo(() => {
    const groups = {};
    contacts.forEach(c => {
      const parsed = parsePhone(c.phone, defaultCountry);
      const std = parsed ? parsed.number : normalizeRawNumber(c.phone);
      if (!std) return;
      
      if (!groups[std]) {
        groups[std] = [];
      }
      groups[std].push(c);
    });

    return Object.keys(groups)
      .filter(key => groups[key].length > 1)
      .map(key => ({
        stdPhone: key,
        list: groups[key]
      }));
  }, [contacts, defaultCountry]);

  const invalidContacts = React.useMemo(() => {
    const list = [];
    contacts.forEach(c => {
      const valid = isPhoneValid(c.phone, defaultCountry);
      const correction = suggestPhoneCorrection(c.phone, defaultCountry);
      
      if (!valid || correction) {
        list.push({
          contact: c,
          reason: correction ? correction.reason : "Phone number does not match standard lengths.",
          suggested: correction ? correction.fixed : null,
          details: getCountryDetails(c.phone, defaultCountry)
        });
      }
    });
    return list;
  }, [contacts, defaultCountry]);

  // --- Action: Merge Duplicate Group ---
  const handleMergeGroup = (stdPhone, list) => {
    if (list.length < 2) return;
    
    const primary = list[0];
    
    const mergedContact = {
      ...primary,
      name: list.reduce((best, cur) => cur.name.length > best.name.length ? cur : best, primary).name,
      email: list.map(x => x.email).find(e => e !== '') || primary.email,
      birthday: list.map(x => x.birthday).find(b => b !== '') || primary.birthday || '',
      address: list.map(x => x.address).find(a => a !== '') || primary.address || '',
      avatar: list.map(x => x.avatar).find(a => a !== '') || primary.avatar,
      social: {
        whatsapp: list.some(x => x.social.whatsapp),
        telegram: list.some(x => x.social.telegram),
        facebook: list.some(x => x.social.facebook),
        instagram: list.some(x => x.social.instagram),
      },
      isGoogleSynced: list.some(x => x.isGoogleSynced)
    };

    const mergedIds = list.map(x => x.id);

    setContacts(prev => {
      const cleaned = prev.filter(c => !mergedIds.includes(c.id));
      return [mergedContact, ...cleaned];
    });

    showToast(`Merged ${list.length} duplicates into "${mergedContact.name}"`);
  };

  // --- Action: Auto Merge All Duplicates ---
  const handleMergeAllDuplicates = () => {
    if (duplicateGroups.length === 0) return;
    duplicateGroups.forEach(g => {
      handleMergeGroup(g.stdPhone, g.list);
    });
    showToast("Successfully auto-merged all duplicates!");
  };

  // --- Action: Apply Corrective Suggestion ---
  const handleFixPhone = (contactId, suggestedNum) => {
    if (!suggestedNum) return;
    
    setContacts(prev => prev.map(c => {
      if (c.id === contactId) {
        return {
          ...c,
          phone: suggestedNum
        };
      }
      return c;
    }));

    showToast("Phone number corrected successfully!");
  };

  // --- Action: Auto Fix All Invalid Numbers ---
  const handleFixAllNumbers = () => {
    let fixCount = 0;
    setContacts(prev => prev.map(c => {
      const correction = suggestPhoneCorrection(c.phone, defaultCountry);
      if (correction && correction.fixed) {
        fixCount++;
        return { ...c, phone: correction.fixed };
      }
      return c;
    }));
    showToast(`Corrected prefix and format rules for ${fixCount} numbers!`);
  };

  // --- Action: Reset Application DB ---
  const handleResetDB = () => {
    if (confirm("This will erase all edits, merges, and syncs, returning the database to initial state. Proceed?")) {
      setContacts(INITIAL_CONTACTS);
      setSelectedCountryFilter('ALL');
      setSelectedContact(null);
      showToast("App database reset to defaults.");
    }
  };

  return (
    <>
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      {/* --- TOP BRAND HEADER --- */}
      <header className="app-header">
        <div className="app-title-container">
          <h1 className="app-title">Contact HH</h1>
          <span className="app-subtitle">Smart Organizer</span>
        </div>
        <div 
          className="country-badge" 
          onClick={() => {
            const index = Object.keys(COUNTRY_META);
            const currentIdx = index.indexOf(defaultCountry);
            const nextIdx = (currentIdx + 1) % index.length;
            const nextCode = index[nextIdx];
            setDefaultCountry(nextCode);
            localStorage.setItem('contact_hh_default_country', nextCode);
            showToast(`Default local prefix toggled to: ${COUNTRY_META[nextCode].name} (${COUNTRY_META[nextCode].code})`);
          }}
          title="Toggle Default country code context in search/addition"
        >
          <span>Context:</span>
          <strong>{COUNTRY_META[defaultCountry]?.flag} {COUNTRY_META[defaultCountry]?.code}</strong>
        </div>
      </header>

      {/* --- QUICK METRICS PANEL --- */}
      <section className="stats-grid">
        <div className="glass-card stat-item">
          <span className="stat-val">{contacts.length}</span>
          <span className="stat-lbl">Contacts</span>
        </div>
        <div className="glass-card stat-item" style={{ borderColor: duplicateGroups.length > 0 ? 'var(--accent-rose)' : 'var(--glass-border)' }}>
          <span className="stat-val" style={{ color: duplicateGroups.length > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
            {duplicateGroups.length}
          </span>
          <span className="stat-lbl">Duplicates</span>
        </div>
        <div className="glass-card stat-item" style={{ borderColor: invalidContacts.length > 0 ? 'var(--accent-rose)' : 'var(--glass-border)' }}>
          <span className="stat-val" style={{ color: invalidContacts.length > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
            {invalidContacts.length}
          </span>
          <span className="stat-lbl">Faulty</span>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 📘 TAB 1: CONTACTS MAIN LIST */}
      {/* ========================================================= */}
      {activeTab === 'contacts' && (
        <>
          <section className="search-filter-section">
            {/* Search Input */}
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search by name or number..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <X 
                  className="search-icon" 
                  size={18} 
                  style={{ left: 'auto', right: '14px', cursor: 'pointer', pointerEvents: 'auto' }} 
                  onClick={() => setSearchQuery('')}
                />
              )}
            </div>

            {/* Country scrolling filter badges */}
            <div className="country-filter-scroll">
              <div 
                className={`country-badge ${selectedCountryFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedCountryFilter('ALL')}
              >
                <span>🌍 All Countries</span>
                <span className="badge-count">{contacts.length}</span>
              </div>
              {Object.keys(countryCounts).map(iso => {
                const meta = COUNTRY_META[iso] || { name: iso, flag: '🏳️' };
                return (
                  <div 
                    key={iso}
                    className={`country-badge ${selectedCountryFilter === iso ? 'active' : ''}`}
                    onClick={() => setSelectedCountryFilter(iso)}
                  >
                    <span>{meta.flag} {meta.name}</span>
                    <span className="badge-count">{countryCounts[iso]}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Contact groups scroll listing */}
          <div className="contacts-scroll-container">
            {Object.keys(groupedContacts).length === 0 ? (
              <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Users size={48} style={{ margin: '0 auto 12px', strokeWidth: 1, color: 'var(--text-muted)' }} />
                <h3>No contacts found</h3>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>Try adjusting your search filters or sync with Google.</p>
              </div>
            ) : (
              Object.keys(groupedContacts).map(groupName => (
                <div key={groupName}>
                  <div className="contact-group-header">
                    <span>{groupName}</span>
                    <span>{groupedContacts[groupName].length} contact(s)</span>
                  </div>
                  <div className="contact-card-list">
                    {groupedContacts[groupName].map(c => {
                      const details = getCountryDetails(c.phone, defaultCountry);
                      return (
                        <div 
                          key={c.id} 
                          className="glass-card contact-item-row"
                          onClick={() => setSelectedContact(c)}
                        >
                          <div className="contact-avatar-wrapper">
                            {c.avatar ? (
                              <img src={c.avatar} className="contact-avatar" alt={c.name} />
                            ) : (
                              <div className="contact-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-purple) 0%, #3b82f6 100%)', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                                {c.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                              </div>
                            )}
                            {c.isGoogleSynced && (
                              <div className="contact-status-dot" style={{ backgroundColor: '#4285F4' }} title="Synced from Google"></div>
                            )}
                          </div>

                          <div className="contact-info">
                            <h3 className="contact-name">{c.name}</h3>
                            <div className="contact-number">
                              <span>{c.phone}</span>
                              <span className="contact-country-label">{details.iso}</span>
                            </div>

                            {/* Social mini presence checkers */}
                            <div className="social-icons-row">
                              <span className={`social-mini-badge ${c.social.whatsapp ? 'active-wa' : ''}`}>WA</span>
                              <span className={`social-mini-badge ${c.social.telegram ? 'active-tg' : ''}`}>TG</span>
                              <span className={`social-mini-badge ${c.social.facebook ? 'active-fb' : ''}`}>FB</span>
                              <span className={`social-mini-badge ${c.social.instagram ? 'active-ig' : ''}`}>IG</span>
                            </div>
                          </div>

                          <ChevronRight className="chevron-arrow" size={18} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Floating Add contact trigger button */}
          <button className="floating-add-btn" onClick={() => setIsAddOpen(true)}>
            <Plus size={28} />
          </button>
        </>
      )}

      {/* ========================================================= */}
      {/* 🔄 TAB 2: GOOGLE CONTACTS SYNC HUB */}
      {/* ========================================================= */}
      {activeTab === 'sync' && (
        <div className="sync-dashboard">
          <div className="glass-card sync-status-card">
            <div className="google-g-logo">
              <svg viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Google Contacts Sync</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Import cloud contacts automatically, fix their local dial patterns, and verify social messaging platforms.
              </p>
            </div>

            {isSyncing ? (
              <div className="sync-progress-tracker">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>Synchronizing...</span>
                  <strong>{syncProgress}%</strong>
                </div>
                <div className="progress-track-bg">
                  <div className="progress-fill" style={{ width: `${syncProgress}%` }}></div>
                </div>
              </div>
            ) : (
              <button className="sync-button-google" onClick={triggerGoogleSync}>
                <RefreshCw size={18} />
                Sync with Google Account
              </button>
            )}
          </div>

          {/* Sync logs terminal */}
          <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={14} style={{ color: 'var(--accent-teal)' }} />
              Live Integration Terminal Logs
            </h3>
            <div className="log-terminal">
              {syncLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Terminal idle. Awaiting OAuth sync trigger...</div>
              ) : (
                syncLogs.map((log, index) => (
                  <div key={index} style={{ marginBottom: '4px', wordBreak: 'break-all' }}>{log}</div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🛠️ TAB 3: FIXER HUB (DUPLICATES & CORRECTIONS) */}
      {/* ========================================================= */}
      {activeTab === 'fixer' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Subtab Toggle */}
          <div className="fixer-tab-headers">
            <button 
              className={`fixer-subtab-btn ${fixerSubtab === 'duplicates' ? 'active' : ''}`}
              onClick={() => setFixerSubtab('duplicates')}
            >
              Duplicates ({duplicateGroups.length})
            </button>
            <button 
              className={`fixer-subtab-btn ${fixerSubtab === 'corrections' ? 'active' : ''}`}
              onClick={() => setFixerSubtab('corrections')}
            >
              Incorrect Numbers ({invalidContacts.length})
            </button>
          </div>

          <div className="fixer-dashboard">
            {/* --- SUBTAB A: DUPLICATE CONTACTS MERGER --- */}
            {fixerSubtab === 'duplicates' && (
              <>
                <div className="glass-card fix-warning-card" style={{ padding: '12px', fontSize: '13px', display: 'flex', gap: '10px' }}>
                  <AlertTriangle style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Duplicate Contacts Found!</strong>
                    <p style={{ marginTop: '2px', fontSize: '11px', color: 'rgba(244, 63, 94, 0.85)' }}>
                      We detected duplicate accounts holding the same phone numbers. Merge them to unify emails and social tags.
                    </p>
                  </div>
                </div>

                {duplicateGroups.length > 0 && (
                  <button className="btn-block primary" onClick={handleMergeAllDuplicates}>
                    <Sparkles size={18} />
                    Auto-Merge All Duplicates
                  </button>
                )}

                {duplicateGroups.length === 0 ? (
                  <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <CheckCircle size={44} style={{ margin: '0 auto 12px', color: 'var(--accent-teal)' }} />
                    <h3>No duplicates detected!</h3>
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>Your database is perfectly optimized and clean.</p>
                  </div>
                ) : (
                  duplicateGroups.map((g, idx) => (
                    <div key={idx} className="glass-card merge-match-card">
                      <div className="merge-match-header">
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Shared Number: <strong>{g.stdPhone}</strong>
                        </span>
                        <span className="country-badge active" style={{ fontSize: '10px', padding: '2px 8px' }}>
                          {g.list.length} Records
                        </span>
                      </div>
                      
                      <div className="merge-candidates">
                        {g.list.map((c, i) => (
                          <div key={i} className="candidate-block">
                            <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{c.name}</strong>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                              {c.email || 'No email'}
                            </span>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '10px' }}>
                              {c.birthday ? `🎂 ${c.birthday}` : ''} {c.address ? `📍 ${c.address.substring(0, 15)}...` : ''}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--accent-purple)', fontWeight: 600 }}>
                              {c.isGoogleSynced ? 'Google Contact' : 'Local Phone'}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="merge-action-bar">
                        <button 
                          className="btn-small primary" 
                          onClick={() => handleMergeGroup(g.stdPhone, g.list)}
                        >
                          Unify & Merge Group
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* --- SUBTAB B: INVALID PHONE CORRECTOR --- */}
            {fixerSubtab === 'corrections' && (
              <>
                <div className="glass-card fix-warning-card" style={{ padding: '12px', fontSize: '13px', display: 'flex', gap: '10px', background: 'rgba(20, 184, 166, 0.08)', border: '1px dashed rgba(20, 184, 166, 0.3)', color: 'var(--accent-teal)' }}>
                  <Info style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Phone Format Intelligence</strong>
                    <p style={{ marginTop: '2px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Local dial layouts (e.g. 8 digits for Tunisia, 10 for France) missing dialing codes will be automatically corrected.
                    </p>
                  </div>
                </div>

                {invalidContacts.some(c => c.suggested) && (
                  <button className="btn-block primary" style={{ background: 'linear-gradient(135deg, var(--accent-teal) 0%, #0f766e 100%)', boxShadow: '0 4px 15px rgba(20, 184, 166, 0.25)' }} onClick={handleFixAllNumbers}>
                    <Sparkles size={18} />
                    Auto-Fix Prefix Mismatches
                  </button>
                )}

                {invalidContacts.length === 0 ? (
                  <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <CheckCircle size={44} style={{ margin: '0 auto 12px', color: 'var(--accent-teal)' }} />
                    <h3>All numbers formatted correctly!</h3>
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>All dials contain perfect international country suffixes.</p>
                  </div>
                ) : (
                  invalidContacts.map((item, idx) => (
                    <div key={idx} className="glass-card corrector-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>{item.contact.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.details.flag} {item.details.name}</span>
                      </div>
                      
                      <div className="correction-flow">
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Current Phone</span>
                          <span className="erroneous-num">{item.contact.phone}</span>
                        </div>
                        <ChevronRight className="chevron-arrow" size={16} />
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Suggested Fix</span>
                          {item.suggested ? (
                            <span className="suggested-num">{item.suggested}</span>
                          ) : (
                            <span style={{ color: 'var(--accent-rose)', fontSize: '12px', fontWeight: 600 }}>Needs Revision</span>
                          )}
                        </div>
                      </div>

                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={12} style={{ color: 'var(--accent-rose)' }} />
                        {item.reason}
                      </p>

                      {item.suggested && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-small accent" 
                            onClick={() => handleFixPhone(item.contact.id, item.suggested)}
                          >
                            Apply Autocorrect Suggestion
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ⚙️ TAB 4: APPLICATION SETTINGS */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <div className="settings-list">
          {/* THEME SELECTION PANEL */}
          <div className="settings-group">
            <span className="settings-group-title">Personalized Themes</span>
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '10px', 
                marginTop: '6px' 
              }}
            >
              {[
                { key: 'purple',    label: 'Purple Neon',     desc: 'Dark Violet',      dot: '#8b5cf6' },
                { key: 'emerald',   label: 'Emerald Mint',    desc: 'Teal Green',        dot: '#14b8a6' },
                { key: 'rose',      label: 'Crimson Rose',    desc: 'Rosewood Magenta', dot: '#f43f5e' },
                { key: 'cyberpunk', label: 'Cyberpunk',       desc: 'Industrial Amber', dot: '#f59e0b' },
                { key: 'oceanic',   label: 'Oceanic Royal',   desc: 'Sapphire & Gold',  dot: '#3b82f6' },
                { key: 'forest',    label: 'Midnight Forest', desc: 'Jungle & Mint',    dot: '#22c55e' },
                { key: 'vaporwave', label: 'Vaporwave',       desc: 'Cyan & Pink',      dot: '#06b6d4' },
                { key: 'midnight',  label: 'Deep Midnight',   desc: 'Galaxy Indigo',    dot: '#818cf8' },
                { key: 'sunset',    label: 'Sunset Blaze',    desc: 'Desert Orange',    dot: '#fb923c' },
                { key: 'arctic',    label: 'Arctic Ice',      desc: 'Glacier Cyan',     dot: '#67e8f9' },
                { key: 'grape',     label: 'Cosmic Grape',    desc: 'Deep Violet',      dot: '#c084fc' },
                { key: 'cherry',    label: 'Cherry Blossom',  desc: 'Sakura Pink',      dot: '#fb7185' },
                { key: 'light',     label: 'Solar Light',     desc: 'Frosted Glass',    dot: '#6d28d9' },
              ].map(t => (
                <div 
                  key={t.key}
                  className="glass-card"
                  style={{ 
                    cursor: 'pointer',
                    padding: '10px 12px',
                    border: theme === t.key ? `2px solid ${t.dot}` : '1px solid var(--glass-border)',
                    background: theme === t.key ? `${t.dot}18` : 'var(--glass-bg)',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                  onClick={() => setTheme(t.key)}
                >
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: t.dot, flexShrink: 0, boxShadow: theme === t.key ? `0 0 10px ${t.dot}` : 'none', transition: 'box-shadow 0.3s' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <strong style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.2' }}>{t.label}</strong>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{t.desc}</span>
                  </div>
                  {theme === t.key && <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: t.dot }} />}
                </div>
              ))}
            </div>
          </div>

          <div className="settings-group" style={{ marginTop: '10px' }}>
            <span className="settings-group-title">Preferences</span>
            
            <div className="setting-row-item">
              <div className="setting-details">
                <span className="setting-title">Local Prefix Context</span>
                <span className="setting-desc">Assume country rules for raw 8/10 digit inputs</span>
              </div>
              <select 
                className="form-control" 
                style={{ width: '130px', padding: '6px 10px', fontSize: '13px' }}
                value={defaultCountry}
                onChange={(e) => {
                  setDefaultCountry(e.target.value);
                  localStorage.setItem('contact_hh_default_country', e.target.value);
                  showToast(`Default fallback dialing rules set to: ${COUNTRY_META[e.target.value].name}`);
                }}
              >
                {Object.keys(COUNTRY_META).map(iso => (
                  <option key={iso} value={iso}>{COUNTRY_META[iso].flag} {COUNTRY_META[iso].name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="settings-group" style={{ marginTop: '10px' }}>
            <span className="settings-group-title">API Integrations</span>
            <div className="form-group" style={{ padding: '0 4px' }}>
              <label style={{ fontSize: '12px' }}>Google People API Key (OAuth Client ID)</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Paste your Google API credentials here..." 
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Required to sync real contacts directly from your Google account.
              </span>
            </div>
          </div>

          <div className="settings-group" style={{ marginTop: '10px' }}>
            <span className="settings-group-title" style={{ color: 'var(--accent-rose)' }}>Database Administration</span>
            
            <div className="setting-row-item" style={{ border: '1px solid rgba(244, 63, 94, 0.2)' }}>
              <div className="setting-details">
                <span className="setting-title" style={{ color: 'var(--accent-rose)' }}>Erase & Reset</span>
                <span className="setting-desc">Wipe edits and reload starting duplicates/formats</span>
              </div>
              <button 
                className="btn-small" 
                style={{ background: 'rgba(244,63,94,0.15)', color: 'var(--accent-rose)' }}
                onClick={handleResetDB}
              >
                Reset Database
              </button>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px', marginTop: '4px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <strong>Contact HH Application • v1.2.0</strong>
            <span>Built with High Performance Vanilla CSS, React, and libphonenumber-js</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Created by Google Gemini for Hamza</span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 👤 BOTTOM DRAWER: CONTACT DETAILS MODAL OVERLAY */}
      {/* ========================================================= */}
      {selectedContact && (
        <div className="modal-overlay" onClick={() => setSelectedContact(null)}>
          <div className="modal-content-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-drag-handle" onClick={() => setSelectedContact(null)}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                className="btn-small secondary" 
                onClick={() => {
                  setEditFormData({
                    id: selectedContact.id,
                    name: selectedContact.name,
                    phone: selectedContact.phone,
                    email: selectedContact.email,
                    birthday: selectedContact.birthday || '',
                    address: selectedContact.address || '',
                    countryCode: selectedContact.countryCode || getCountryDetails(selectedContact.phone, defaultCountry).iso,
                    avatar: selectedContact.avatar || ''
                  });
                  setIsEditOpen(true);
                }}
              >
                <Edit3 size={14} style={{ marginRight: '4px', display: 'inline' }} />
                Edit
              </button>
              <button 
                className="btn-small" 
                style={{ background: 'rgba(244,63,94,0.15)', color: 'var(--accent-rose)' }}
                onClick={() => handleDeleteContact(selectedContact.id)}
              >
                <Trash2 size={14} style={{ marginRight: '4px', display: 'inline' }} />
                Delete
              </button>
            </div>

            <div className="detail-header-card">
              <div style={{ position: 'relative' }}>
                {selectedContact.avatar ? (
                  <img src={selectedContact.avatar} className="detail-avatar" alt={selectedContact.name} />
                ) : (
                  <div className="detail-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-purple) 0%, #3b82f6 100%)', color: 'white', fontWeight: 800, fontSize: '32px' }}>
                    {selectedContact.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                  </div>
                )}
                {selectedContact.isGoogleSynced && (
                  <div className="contact-status-dot" style={{ backgroundColor: '#4285F4', width: '22px', height: '22px', border: '3px solid var(--drawer-bg)', borderRadius: '50%', bottom: '2px', right: '2px' }} title="Synced from Google"></div>
                )}
              </div>
              <h2 className="detail-name">{selectedContact.name}</h2>
              <span className="country-badge" style={{ display: 'inline-flex', alignSelf: 'center' }}>
                {getCountryDetails(selectedContact.phone, defaultCountry).flag} {getCountryDetails(selectedContact.phone, defaultCountry).name}
              </span>
            </div>

            {/* --- SOCIAL PRESENCE ACTIONS DIRECT DEEP LINKS --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Social Messaging Shortcuts</span>
              <div className="social-actions-flex">
                <a 
                  href={`https://wa.me/${normalizeRawNumber(selectedContact.phone)}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-action-btn wa"
                >
                  <div className="social-action-circle">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                      <path d="M12.012 2C6.48 2 2 6.48 2 12.012c0 1.764.456 3.48 1.332 5.004L2 22l5.124-1.344c1.476.804 3.132 1.236 4.884 1.236 5.532 0 10.012-4.48 10.012-10.012C22.02 6.48 17.544 2 12.012 2zm6.36 14.28c-.264.744-1.536 1.356-2.124 1.416-.576.06-1.152.096-3.696-.948-3.252-1.344-5.34-4.644-5.508-4.872-.168-.228-1.344-1.788-1.344-3.408 0-1.62.84-2.412 1.14-2.736.3-.324.66-.408.888-.408.228 0 .456.012.648.024.204.012.48-.048.744.588.264.648.912 2.22 1 2.388.084.168.144.372.036.588-.108.216-.168.348-.336.552-.168.192-.348.432-.504.576-.168.156-.348.324-.144.672.204.348.9 1.488 1.932 2.4 1.332 1.188 2.448 1.56 2.808 1.716.36.156.576.132.792-.12.216-.252.936-1.092 1.188-1.464.252-.372.504-.312.852-.18.348.132 2.208 1.044 2.592 1.236.384.192.636.288.732.444.096.168.096.96-.168 1.704z"/>
                    </svg>
                  </div>
                  <span>WhatsApp</span>
                </a>

                <a 
                  href={`https://t.me/+${normalizeRawNumber(selectedContact.phone)}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-action-btn tg"
                >
                  <div className="social-action-circle">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.12 1.24-.64 4.28-.9 5.68-.11.6-.33 1.2-.56 1.2-.48 0-.84-.36-1.3-.66-.73-.48-1.14-.78-1.85-1.25-.82-.54-.29-.84.18-1.33.12-.13 2.27-2.08 2.31-2.27.01-.02.01-.11-.04-.15-.05-.05-.12-.03-.17-.02-.07.01-1.2 1.15-3.39 2.63-.32.22-.61.33-.87.32-.28-.01-.83-.16-1.24-.3-.5-.16-.9-.25-.87-.53.02-.15.22-.3.62-.47 2.43-1.06 4.05-1.76 4.86-2.1.81-.34 1.62-.68 2.43-1.02.81-.34 1.21-.5 1.21-.5s.2 0 .2.2c0 .03-.02.38-.04.62z"/>
                    </svg>
                  </div>
                  <span>Telegram</span>
                </a>

                <a 
                  href={`https://signal.me/#p/+${normalizeRawNumber(selectedContact.phone)}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-action-btn"
                  style={{ background: 'rgba(58, 118, 240, 0.1)', color: '#3a76f0', borderColor: 'rgba(58, 118, 240, 0.25)' }}
                >
                  <div className="social-action-circle" style={{ background: '#3a76f0' }}>
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.61 14.86c-1.33.51-2.83.18-3.83-.8l-3.32-3.32a3.02 3.02 0 0 1 .8-4.57 3.02 3.02 0 0 1 3.52.28l3.65 3.65c.98.98.98 2.57 0 3.56l-.82.82c-.22.22-.49.37-.8.38z"/>
                    </svg>
                  </div>
                  <span>Signal</span>
                </a>
              </div>
            </div>

            {/* --- GOOGLE & HARDWARE DETAILS --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Registry Details</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="detail-phone-item">
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Primary Phone</span>
                    <strong style={{ fontSize: '15px' }}>{selectedContact.phone}</strong>
                  </div>
                  <a href={`tel:${selectedContact.phone}`} className="social-mini-badge active-wa" style={{ width: '32px', height: '32px' }}>
                    <Phone size={16} />
                  </a>
                </div>

                {selectedContact.email && (
                  <div className="detail-phone-item">
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Email Address</span>
                      <strong style={{ fontSize: '14px' }}>{selectedContact.email}</strong>
                    </div>
                    <a href={`mailto:${selectedContact.email}`} className="social-mini-badge active-tg" style={{ width: '32px', height: '32px' }}>
                      <Mail size={16} />
                    </a>
                  </div>
                )}

                {/* Date of Birth View Block */}
                {selectedContact.birthday && (
                  <div className="detail-phone-item">
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Date of Birth</span>
                      <strong style={{ fontSize: '14px' }}>{new Date(selectedContact.birthday).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                    </div>
                    <div className="social-mini-badge active-wa" style={{ width: '32px', height: '32px', color: '#e0f2fe', background: 'rgba(56, 189, 248, 0.15)' }}>
                      <Calendar size={16} />
                    </div>
                  </div>
                )}

                {/* Address View Block */}
                {selectedContact.address && (
                  <div className="detail-phone-item">
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Address Location</span>
                      <strong style={{ fontSize: '13px', lineHeight: '130%' }}>{selectedContact.address}</strong>
                    </div>
                    <div className="social-mini-badge active-tg" style={{ width: '32px', height: '32px', color: '#fef3c7', background: 'rgba(245, 158, 11, 0.15)' }}>
                      <MapPin size={16} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 📥 BOTTOM DRAWER: ADD CONTACT MODAL FORM */}
      {/* ========================================================= */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-content-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-drag-handle" onClick={() => setIsAddOpen(false)}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Create Contact</h2>
              <button className="social-mini-badge" onClick={() => setIsAddOpen(false)} style={{ background: 'rgba(255,255,255,0.08)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Contact Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Hamza HH" 
                  value={addFormData.name}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Explicit Country</label>
                  <select 
                    className="form-control"
                    value={addFormData.countryCode}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                  >
                    <option value="">Auto-Detect Prefix</option>
                    {Object.keys(COUNTRY_META).map(iso => (
                      <option key={iso} value={iso}>
                        {COUNTRY_META[iso].flag} {COUNTRY_META[iso].name} ({COUNTRY_META[iso].code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    placeholder="e.g. 22123456" 
                    value={addFormData.phone}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Live validation indicator */}
              {addFormData.phone.trim() && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginTop: '-4px' }}>
                  {isPhoneValid(addFormData.phone, addFormData.countryCode || defaultCountry) ? (
                    <>
                      <CheckCircle size={13} style={{ color: 'var(--accent-teal)' }} />
                      <span style={{ color: 'var(--accent-teal)', fontWeight: 500 }}>
                        Valid dial format.
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={13} style={{ color: 'var(--accent-rose)' }} />
                      <span style={{ color: 'var(--accent-rose)', fontWeight: 500 }}>
                        Incorrect format. Fixer Hub will offer corrections.
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Profile Picture URL</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Paste an Unsplash or social image URL..." 
                    value={addFormData.avatar}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, avatar: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                  {addFormData.avatar && (
                    <img 
                      src={addFormData.avatar} 
                      alt="Preview" 
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--glass-border)' }} 
                      onError={(e) => { e.style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="e.g. hamza@gmail.com" 
                  value={addFormData.email}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={addFormData.birthday}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, birthday: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Physical Address</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Tunis, Sousse" 
                    value={addFormData.address}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>

              <button type="submit" className="btn-block primary" style={{ marginTop: '6px' }}>
                <Save size={18} />
                Save New Contact
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 📝 BOTTOM DRAWER: EDIT CONTACT MODAL FORM */}
      {/* ========================================================= */}
      {isEditOpen && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-drag-handle" onClick={() => setIsEditOpen(false)}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Edit Contact</h2>
              <button className="social-mini-badge" onClick={() => setIsEditOpen(false)} style={{ background: 'rgba(255,255,255,0.08)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Contact Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Country Context</label>
                  <select 
                    className="form-control"
                    value={editFormData.countryCode}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                  >
                    <option value="">Auto-Detect Prefix</option>
                    {Object.keys(COUNTRY_META).map(iso => (
                      <option key={iso} value={iso}>
                        {COUNTRY_META[iso].flag} {COUNTRY_META[iso].name} ({COUNTRY_META[iso].code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Live validation indicator */}
              {editFormData.phone.trim() && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginTop: '-4px' }}>
                  {isPhoneValid(editFormData.phone, editFormData.countryCode || defaultCountry) ? (
                    <>
                      <CheckCircle size={13} style={{ color: 'var(--accent-teal)' }} />
                      <span style={{ color: 'var(--accent-teal)', fontWeight: 500 }}>
                        Valid dial format.
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={13} style={{ color: 'var(--accent-rose)' }} />
                      <span style={{ color: 'var(--accent-rose)', fontWeight: 500 }}>
                        Incorrect format. Fixer Hub will offer corrections.
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Profile Picture URL</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Paste an Unsplash or social image URL..." 
                    value={editFormData.avatar}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, avatar: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                  {editFormData.avatar && (
                    <img 
                      src={editFormData.avatar} 
                      alt="Preview" 
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--glass-border)' }} 
                      onError={(e) => { e.style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={editFormData.email}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={editFormData.birthday}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, birthday: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Physical Address</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editFormData.address}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>

              <button type="submit" className="btn-block primary" style={{ marginTop: '6px' }}>
                <Save size={18} />
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🔔 GLOBAL TOAST NOTIFICATION */}
      {/* ========================================================= */}
      {notification && (
        <div 
          className="glass-card" 
          style={{ 
            position: 'fixed', 
            top: '20px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            width: '90%', 
            maxWidth: '400px', 
            zIndex: '10000', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '14px 20px',
            border: notification.type === 'error' ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(20, 184, 166, 0.4)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            background: 'rgba(15, 19, 36, 0.95)',
            animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {notification.type === 'error' ? (
            <AlertCircle size={20} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
          ) : (
            <CheckCircle size={20} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {notification.message}
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🧭 BOTTOM MOBILE NAVIGATION TABS */}
      {/* ========================================================= */}
      <nav className="bottom-nav-bar">
        <div 
          className={`nav-tab-item ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => { setActiveTab('contacts'); setSelectedCountryFilter('ALL'); }}
        >
          <Users size={20} />
          <span>Contacts</span>
        </div>
        
        <div 
          className={`nav-tab-item ${activeTab === 'sync' ? 'active' : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          <RefreshCw size={20} />
          <span>Google Sync</span>
        </div>

        <div 
          className={`nav-tab-item ${activeTab === 'fixer' ? 'active' : ''}`}
          onClick={() => setActiveTab('fixer')}
        >
          <AlertTriangle size={20} />
          <span>Fixer Hub</span>
        </div>

        <div 
          className={`nav-tab-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={20} />
          <span>Settings</span>
        </div>
      </nav>
    </>
  );
}

export default App;
