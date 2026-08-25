import { useRef, useState } from 'react';
import './RSVP.css';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzfUWs0YE2E8vLw96wH4gumIydawY2P0sn7F_PkAD2UlL3O9dsfzNy4Bcl2DJtIzgk0/exec';
const ITINERARY_RSVP_STORAGE_KEY = 'wedding_rsvp_itinerary';
const RSVP_LOOKUP_CACHE = new Map();
const RSVP_SESSION_CACHE_KEY = 'wedding_rsvp_lookup_cache';
const SEARCH_RESULTS_PAGE_SIZE = 3;
const NAME_SUFFIX_TERMS = ['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv'];

const MEAL_OPTIONS = [
  { value: '', label: 'Select a meal…' },
  { value: 'Chicken', label: 'Chicken' },
  { value: 'Beef', label: 'Beef' },
  { value: 'Fish', label: 'Fish' },
  { value: 'Vegetarian', label: 'Vegetarian' },
];

const EVENTS = [
  {
    key: 'rehearsalRsvp',
    title: 'Rehearsal Dinner',
    date: 'Thursday, April 1, 2027',
    conditional: (member) => member.invitedToRehearsal,
  },
  {
    key: 'ceremonyRsvp',
    title: 'Ceremony',
    date: 'Friday, April 2, 2027',
    conditional: () => true,
  },
  {
    key: 'receptionRsvp',
    title: 'Reception',
    date: 'Friday, April 2, 2027',
    conditional: () => true,
  },
];

async function lookupInvitations(query) {
  const normalized = normalizeText(query);
  if (!normalized) return [];

  if (RSVP_LOOKUP_CACHE.size === 0) {
    try {
      const rawCache = sessionStorage.getItem(RSVP_SESSION_CACHE_KEY);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (parsed && typeof parsed === 'object') {
          Object.entries(parsed).forEach(([key, value]) => {
            if (Array.isArray(value)) RSVP_LOOKUP_CACHE.set(key, value);
          });
        }
      }
    } catch {
      // Ignore cache hydration errors.
    }
  }

  if (RSVP_LOOKUP_CACHE.has(normalized)) {
    return RSVP_LOOKUP_CACHE.get(normalized);
  }
  const url = `${SCRIPT_URL}?action=lookup&q=${encodeURIComponent(query)}`;

  let data;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      throw new Error(`Lookup failed (${res.status}).`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      // If HTML or a login redirect was returned, try JSONP fallback.
      data = await jsonpFetch(url);
    } else {
      data = await res.json();
    }
  } catch (err) {
    // Network-level fetch failures (CORS, redirect to login) often surface here.
    // Try JSONP fallback once — this requires the Apps Script to support `callback=`.
    try {
      data = await jsonpFetch(url);
    } catch (err2) {
      throw err;
    }
  }

  if (data?.error) {
    throw new Error(String(data.error));
  }

  const matches = Array.isArray(data.matches) ? data.matches : [];
  if (matches.length > 0) {
    RSVP_LOOKUP_CACHE.set(normalized, matches);
  }

  try {
    const serialized = Object.fromEntries(RSVP_LOOKUP_CACHE.entries());
    sessionStorage.setItem(RSVP_SESSION_CACHE_KEY, JSON.stringify(serialized));
  } catch {
    // Ignore cache persistence errors.
  }

  return matches;
}

function YesNo({ value, onChange }) {
  return (
    <div className="yes-no-group">
      <label className={`yn-option${value === 'Yes' ? ' yn-selected' : ''}`}>
        <input type="radio" value="Yes" checked={value === 'Yes'} onChange={() => onChange('Yes')} />
        Yes
      </label>
      <label className={`yn-option${value === 'No' ? ' yn-selected' : ''}`}>
        <input type="radio" value="No" checked={value === 'No'} onChange={() => onChange('No')} />
        No
      </label>
    </div>
  );
}

function EventCard({ event, members, setMemberField }) {
  return (
    <div className="event-section">
      <div className="event-section-header">
        <h3 className="event-section-title">{event.title}</h3>
        <div className="event-section-meta">
          {event.date && <p className="event-section-desc">{event.date}</p>}
        </div>
      </div>
      <div className="event-attendees">
        {members.map((member) => (
          event.conditional(member) && (
            <div key={member.rowIndex} className="attendee-row">
              <span className="attendee-name">{member.name}</span>
              <YesNo 
                value={member.form[event.key]} 
                onChange={(v) => setMemberField(member.rowIndex, event.key, v)} 
              />
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function hasGuestInName(name) {
  return /\bguest\b/i.test(String(name || '').trim());
}

function formatGuestDisplayName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return '';
  return hasGuestInName(trimmed) ? 'Guest' : trimmed;
}

function formatHouseholdNames(members) {
  if (!members || members.length === 0) return '';

  const hasGuest = members.some((m) => hasGuestInName(m.name || m.displayName || ''));
  const partner  = members.find((m) => !hasGuestInName(m.name || m.displayName || ''));

  if (hasGuest && partner && members.length === 2) {
    return `${formatGuestDisplayName(partner.name || partner.displayName)} and Guest`;
  }

  const getDisplay = (m) => m.displayName || formatGuestDisplayName(m.name || '');
  const displayMembers = members.map((m) => ({ ...m, _disp: getDisplay(m) }));

  if (displayMembers.length === 1) return displayMembers[0]._disp;

  const suffixes = new Set(['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v']);
  const getFamilyLastName = (fullName) => {
    const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) return '';
    const tail = parts[parts.length - 1].toLowerCase();
    const lastIdx = suffixes.has(tail) ? parts.length - 2 : parts.length - 1;
    return String(parts[lastIdx] || '').toLowerCase();
  };

  const parsed = displayMembers.map((m) => {
    const parts = m._disp.trim().split(/\s+/);
    return { _disp: m._disp, first: parts[0], familyLast: getFamilyLastName(m._disp) };
  });

  const familyLastNames = parsed.map((p) => p.familyLast).filter(Boolean);
  const allSameLastName =
    familyLastNames.length === parsed.length &&
    familyLastNames.every((ln) => ln === familyLastNames[0]);

  if (allSameLastName && familyLastNames[0]) {
    const displayLast = familyLastNames[0].charAt(0).toUpperCase() + familyLastNames[0].slice(1);
    if (parsed.length >= 3) return `The ${displayLast} Family`;
    const firstNames = parsed.map((p) => p.first).join(' and ');
    return `${firstNames} ${displayLast}`;
  }

  return displayMembers.map((m) => m._disp).join(' and ');
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

// JSONP helper: loads a script with a callback parameter and resolves with parsed data.
function jsonpFetch(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const cbName = `__rsvp_jsonp_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const cleanup = () => {
      try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
      if (script && script.parentNode) script.parentNode.removeChild(script);
      clearTimeout(timer);
    };

    window[cbName] = (data) => {
      resolve(data);
      cleanup();
    };

    const sep = url.includes('?') ? '&' : '?';
    const script = document.createElement('script');
    script.src = `${url}${sep}callback=${cbName}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('JSONP script load error'));
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('JSONP timeout'));
    }, timeout);

    document.head.appendChild(script);
  });
}

function isSimilarToken(queryToken, targetToken) {
  if (!queryToken || !targetToken) return false;
  if (queryToken === targetToken) return true;
  if (targetToken.startsWith(queryToken) || queryToken.startsWith(targetToken)) return true;
  if (Math.abs(queryToken.length - targetToken.length) > 1) return false;

  let edits = 0;
  let i = 0;
  let j = 0;
  while (i < queryToken.length && j < targetToken.length) {
    if (queryToken[i] === targetToken[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (queryToken.length > targetToken.length) {
      i += 1;
    } else if (queryToken.length < targetToken.length) {
      j += 1;
    } else {
      i += 1;
      j += 1;
    }
  }

  return edits + Math.abs(queryToken.length - targetToken.length) <= 1;
}

function includesAllQueryWords(name, queryWords) {
  const targetWords = normalizeText(name).split(/\s+/).filter(Boolean);
  return queryWords.every((word) =>
    targetWords.some((candidate) => isSimilarToken(word, candidate))
  );
}

function getMatchKey(match) {
  const memberKey = (match.members || [])
    .map((m) => String(m.rowIndex))
    .sort()
    .join('|');
  return memberKey || normalizeText(match.matchedName);
}

function filterMatchesByQuery(matches, query) {
  const queryWords = normalizeText(query).split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return matches;

  return matches.filter((match) => {
    if (includesAllQueryWords(match.matchedName, queryWords)) return true;
    if (includesAllQueryWords(match.guestName, queryWords)) return true;
    return (match.members || []).some((m) => includesAllQueryWords(m.name, queryWords));
  });
}

function preferFilteredMatches(matches, query) {
  const filtered = filterMatchesByQuery(matches, query);
  return filtered.length > 0 ? filtered : matches;
}

function splitGuestNames(guestName) {
  return String(guestName || '')
    .split(/\s*(?:,|;|\band\b|&|\+)\s*/i)
    .map((n) => n.trim())
    .filter(Boolean);
}

function chooseSharedData(matches) {
  for (const match of matches) {
    const songRequests = String(match?.shared?.songRequests || '').trim();
    const message = String(match?.shared?.message || '').trim();
    if (songRequests || message) return { songRequests, message };
  }
  return { songRequests: '', message: '' };
}

function mergeUniqueMatches(primary, secondary) {
  const merged = [];
  const seen = new Set();
  for (const match of [...primary, ...secondary]) {
    const key = getMatchKey(match);
    if (!seen.has(key)) { seen.add(key); merged.push(match); }
  }
  return merged;
}

function linkRelatedMatches(matches) {
  if (!Array.isArray(matches) || matches.length === 0) return [];

  const byName = new Map();
  matches.forEach((match, idx) => {
    const candidateNames = [match.matchedName, ...(match.members || []).map((m) => m.name)];
    for (const candidate of candidateNames) {
      const key = normalizeText(candidate);
      if (!key) continue;
      const existing = byName.get(key) || [];
      existing.push(idx);
      byName.set(key, existing);
    }
  });

  const seen = new Set();
  const linked = [];

  for (let i = 0; i < matches.length; i += 1) {
    if (seen.has(i)) continue;
    const queue = [i];
    const group = [];
    while (queue.length > 0) {
      const currentIdx = queue.shift();
      if (seen.has(currentIdx)) continue;
      seen.add(currentIdx);
      group.push(matches[currentIdx]);
      const guestNames = splitGuestNames(matches[currentIdx].guestName);
      for (const guest of guestNames) {
        const linkedIndices = byName.get(normalizeText(guest)) || [];
        for (const linkedIdx of linkedIndices) {
          if (!seen.has(linkedIdx)) queue.push(linkedIdx);
        }
      }
    }
    const mergedMembers = [];
    const memberSeen = new Set();
    for (const match of group) {
      for (const member of match.members || []) {
        const memberKey = String(member.rowIndex);
        if (memberSeen.has(memberKey)) continue;
        memberSeen.add(memberKey);
        mergedMembers.push(member);
      }
    }
    linked.push({ ...group[0], members: mergedMembers, shared: chooseSharedData(group) });
  }

  return linked;
}

function RSVP() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [visibleResultsCount, setVisibleResultsCount] = useState(SEARCH_RESULTS_PAGE_SIZE);
  const [searching, setSearching] = useState(false);
  const [household, setHousehold] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [lookupError, setLookupError] = useState('');
  const latestSearchRequestRef = useRef(0);

  const [form, setForm] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    const requestId = latestSearchRequestRef.current + 1;
    latestSearchRequestRef.current = requestId;

    setSearching(true);
    setLookupError('');
    setSearchResults(null);
    setVisibleResultsCount(SEARCH_RESULTS_PAGE_SIZE);

    try {
      const queryWords = normalizeText(query).split(/\s+/).filter(Boolean);
      let finalMatches = await lookupInvitations(query);

      if (finalMatches.length === 0 && queryWords.length >= 2) {
        const fallbackQueries = [`${queryWords[0]} ${queryWords[queryWords.length - 1]}`];
        const baseName = `${queryWords[0]} ${queryWords[1]}`;
        for (const suffix of NAME_SUFFIX_TERMS) fallbackQueries.push(`${baseName} ${suffix}`);
        const uniqueFallbacks = [...new Set(fallbackQueries.map((q) => q.trim()).filter(Boolean))]
          .filter((q) => normalizeText(q) !== normalizeText(query));
        const fallbackMatchesLists = await Promise.all(
          uniqueFallbacks.map((candidate) => lookupInvitations(candidate))
        );
        for (const matches of fallbackMatchesLists) {
          finalMatches = mergeUniqueMatches(finalMatches, matches);
        }
      }

      const initialMatches = preferFilteredMatches(linkRelatedMatches(finalMatches), query);
      if (latestSearchRequestRef.current === requestId) {
        setSearchResults(initialMatches.length > 0 ? initialMatches : []);
      }
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : 'Lookup failed. Please try again.');
      setSearchResults([]);
    } finally {
      if (latestSearchRequestRef.current === requestId) {
        setSearching(false);
      }
    }
  };

  const initializeHousehold = (match) => {
    const memberForms = match.members.map((m) => ({
      rowIndex: m.rowIndex,
      name: formatGuestDisplayName(m.name),
      displayName: formatGuestDisplayName(m.name),
      invitedToRehearsal: m.invitedToRehearsal === true,
      hasGuest: hasGuestInName(m.name),
      alreadySubmitted: m.alreadySubmitted,
      form: {
        ceremonyRsvp: m.existing?.ceremonyRsvp || '',
        receptionRsvp: m.existing?.receptionRsvp || '',
        rehearsalRsvp: m.existing?.rehearsalRsvp || '',
        meal: m.existing?.meal || '',
        foodAllergies: m.existing?.foodAllergies || '',
      },
    }));
    setHousehold({
      members: memberForms,
      matchedName: match.matchedName,
    });
    setForm({
      members: memberForms,
      shared: {
        message: match.shared?.message || '',
        songRequests: match.shared?.songRequests || '',
        guestName: '',
        sendCopy: false,
        responseEmail: '',
      },
    });
    setSearchResults(null);
  };

  const handleSelectResult = (match) => {
    initializeHousehold(match);
    setFormError('');
  };

  const setMemberField = (memberRowIndex, field, value) => {
    setForm(prev => ({
      ...prev,
      members: prev.members.map(m =>
        m.rowIndex === memberRowIndex
          ? { ...m, form: { ...m.form, [field]: value } }
          : m
      ),
    }));
  };

  const setSharedField = (field, value) => {
    setForm(prev => ({
      ...prev,
      shared: { ...prev.shared, [field]: value },
    }));
  };

  const validate = () => {
    for (const member of form.members) {
      const m = member.form;
      if (!m.ceremonyRsvp) return `Please answer Ceremony for ${member.name}.`;
      if (!m.receptionRsvp) return `Please answer Reception for ${member.name}.`;
      if (member.invitedToRehearsal && !m.rehearsalRsvp) {
        return `Please answer Rehearsal Dinner for ${member.name}.`;
      }
      if (m.receptionRsvp === 'Yes' && !m.meal)
        return `Please select a meal for ${member.name}.`;
    }

    if (form.shared.sendCopy) {
      const email = String(form.shared.responseEmail || '').trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) return 'Please enter an email address to receive your copy.';
      if (!emailPattern.test(email)) return 'Please enter a valid email address.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const params = new URLSearchParams();
      params.append('action', 'submit');
      params.append('members', JSON.stringify(form.members.map(m => ({ rowIndex: m.rowIndex, name: m.name }))));
      params.append('message', form.shared.message);
      params.append('songRequests', form.shared.songRequests);
      params.append('guestName', form.shared.guestName || '');
      params.append('sendCopy', form.shared.sendCopy ? 'Yes' : 'No');
      params.append('responseEmail', form.shared.responseEmail);

      for (const member of form.members) {
        const mKey = `member_${member.rowIndex}`;
        params.append(`${mKey}_ceremonyRsvp`, member.form.ceremonyRsvp);
        params.append(`${mKey}_receptionRsvp`, member.form.receptionRsvp);
        params.append(`${mKey}_rehearsalRsvp`, member.form.rehearsalRsvp);
        params.append(`${mKey}_meal`, member.form.meal);
        params.append(`${mKey}_foodAllergies`, member.form.foodAllergies);
      }

      let data;
      try {
        const res = await fetch(`${SCRIPT_URL}?${params.toString()}`, { redirect: 'follow' });
        const contentType = res.headers.get && res.headers.get('content-type') || '';
        if (res.ok && contentType.toLowerCase().includes('application/json')) {
          data = await res.json();
        } else {
          // Try JSONP fallback for submission as well.
          data = await jsonpFetch(`${SCRIPT_URL}?${params.toString()}`);
        }
      } catch (err) {
        // Try JSONP fallback if fetch failed (CORS/login redirect)
        data = await jsonpFetch(`${SCRIPT_URL}?${params.toString()}`);
      }

      if (data && data.success) {
        const householdName = formatHouseholdNames(form.members.map(m => ({ displayName: m.name })));

        try {
          localStorage.setItem(
            ITINERARY_RSVP_STORAGE_KEY,
            JSON.stringify({
              householdName,
              updatedAt: new Date().toISOString(),
            })
          );
        } catch {
          // Ignore storage errors
        }

        RSVP_LOOKUP_CACHE.clear();
        try { sessionStorage.removeItem(RSVP_SESSION_CACHE_KEY); } catch { /* ignore */ }

        setSubmitted(true);
      } else {
        setFormError('Something went wrong. Please try again or contact us directly.');
      }
    } catch {
      setFormError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rsvp-container">
        <div className="page-hero">
          <span className="page-eyebrow">Noel <span className="amp-symbol">&</span> Peter · April 2, 2027</span>
          <h1 className="page-hero-title">RSVP</h1>
          <div className="page-hero-divider" />
          <div className="success-message">
            <div className="success-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12.8 9.1 17l9.9-9.9" />
              </svg>
              <span className="success-icon-fallback">✓</span>
            </div>
            <h2>Thank You<span className="success-message-character">!</span></h2>
            <p>Your RSVP is in. We cannot wait to celebrate with you!</p>
          </div>
        </div>
      </div>
    );
  }

  const householdNames = household ? formatHouseholdNames(household.members) : '';

  return (
    <div className="rsvp-container">
      <div className="page-hero">
        <span className="page-eyebrow">Noel <span className="amp-symbol">&</span> Peter · April 2, 2027</span>
        <h1 className="page-hero-title">RSVP</h1>
        <div className="page-hero-divider" />

        {!household && (
          <div className="rsvp-lookup">
            <form onSubmit={handleSearch}>
              <div className="form-group hero-search-group">
                <label htmlFor="searchQuery">Find Your Invitation</label>
                <div className="search-input-row">
                  <input
                    type="text"
                    id="searchQuery"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter first and last name"
                    autoComplete="off"
                  />
                  <button type="submit" className="search-button" disabled={searching}>
                    {searching ? '…' : 'Search'}
                  </button>
                </div>
              </div>
            </form>

            {searching && (
              <div className="search-loading" role="status" aria-live="polite">
                <span className="loading-spinner" />
                <span>Searching invitations…</span>
              </div>
            )}

            {searchResults !== null && searchResults.length === 0 && (
              <p className="lookup-error">
                {lookupError || "We couldn't find that name. Please double-check your spelling or contact us directly."}
              </p>
            )}

            {searchResults && searchResults.length > 0 && (
              <div className="search-results">
                <p className="search-results-label">Select your invitation:</p>
                {searchResults.slice(0, visibleResultsCount).map((result, idx) => {
                  const displayName = formatHouseholdNames(result.members) || formatGuestDisplayName(result.matchedName);
                  return (
                    <button
                      key={`${result.matchedName}-${idx}`}
                      className="result-card"
                      onClick={() => handleSelectResult(result)}
                      type="button"
                    >
                      <span className="result-name">{displayName}</span>
                    </button>
                  );
                })}
                {searchResults.length > visibleResultsCount && (
                  <button
                    type="button"
                    className="result-more-button"
                    onClick={() => setVisibleResultsCount((count) => count + SEARCH_RESULTS_PAGE_SIZE)}
                  >
                    Show More Results
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {household && form && (
          <form className="rsvp-form" onSubmit={handleSubmit}>
            <div className="invite-summary">
              <p>
                Welcome, <strong>{householdNames}</strong>.
              </p>
              <button
                type="button"
                className="change-name-btn"
                onClick={() => {
                  setHousehold(null);
                  setForm(null);
                  setSearchQuery('');
                  setVisibleResultsCount(SEARCH_RESULTS_PAGE_SIZE);
                }}
              >
                Search Again
              </button>
            </div>

          {EVENTS
            .filter((event) => form.members.some((member) => event.conditional(member)))
            .map((event) => (
              <EventCard
                key={event.key}
                event={event}
                members={form.members}
                setMemberField={setMemberField}
              />
            ))}

          {/* Guest name — only shown when a guest placeholder is in the household */}
          {form.members.some((m) => m.hasGuest) && (
            <div className="event-section">
              <div className="event-section-header">
                <h3 className="event-section-title">Guest Information</h3>
              </div>
              <div className="guest-info-section">
                {form.members.filter((m) => m.hasGuest).map((member) => (
                  <div key={member.rowIndex} className="form-group guest-entry-group">
                    <label htmlFor={`guestName_${member.rowIndex}`}>{member.name}&apos;s Guest Name</label>
                    <input
                      type="text"
                      id={`guestName_${member.rowIndex}`}
                      value={form.shared.guestName || ''}
                      onChange={(e) => setSharedField('guestName', e.target.value)}
                      placeholder="Enter your guest's full name"
                      autoComplete="name"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {form.members.some(m => m.form.receptionRsvp === 'Yes') && (
            <div className="event-section">
              <div className="event-section-header">
                <h3 className="event-section-title">Meal Selection</h3>
              </div>
              <div className="meal-selections">
                {form.members
                  .filter(member => member.form.receptionRsvp === 'Yes')
                  .map((member) => (
                    <div key={member.rowIndex} className="form-group meal-group">
                      <label htmlFor={`meal_${member.rowIndex}`}>Meal for {member.name}</label>
                      <select
                        id={`meal_${member.rowIndex}`}
                        value={member.form.meal}
                        onChange={(e) => setMemberField(member.rowIndex, 'meal', e.target.value)}
                      >
                        {MEAL_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {form.members.some(member =>
            member.form.receptionRsvp === 'Yes' || member.form.rehearsalRsvp === 'Yes'
          ) && (
            <div className="event-section">
              <div className="event-section-header">
                <h3 className="event-section-title">Food Allergies or Dietary Restrictions</h3>
              </div>
              <div className="allergies-section">
                {form.members
                  .filter(member =>
                    member.form.receptionRsvp === 'Yes' || member.form.rehearsalRsvp === 'Yes'
                  )
                  .map((member) => (
                    <div key={member.rowIndex} className="form-group meal-group">
                      <label htmlFor={`allergies_${member.rowIndex}`}>{member.name}</label>
                      <input
                        type="text"
                        id={`allergies_${member.rowIndex}`}
                        value={member.form.foodAllergies}
                        onChange={(e) => setMemberField(member.rowIndex, 'foodAllergies', e.target.value)}
                        placeholder="Leave blank if none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div className="event-section">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="message">Message to Noel <span className="amp-symbol">&amp;</span> Peter</label>
              <textarea
                id="message"
                value={form.shared.message}
                onChange={(e) => setSharedField('message', e.target.value)}
                rows="4"
                placeholder="Share a note, a wish, or anything you'd like us to know…"
              />
            </div>
          </div>

          <div className="event-section">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="songRequests">Song Requests</label>
              <textarea
                id="songRequests"
                value={form.shared.songRequests}
                onChange={(e) => setSharedField('songRequests', e.target.value)}
                rows="3"
                placeholder="What song will get you on the dance floor?"
              />
            </div>
          </div>

          <div className="event-section">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="checkbox-label" htmlFor="sendCopy">
                <input
                  id="sendCopy"
                  type="checkbox"
                  checked={!!form.shared.sendCopy}
                  onChange={(e) => setSharedField('sendCopy', e.target.checked)}
                />
                <span className="checkbox-label-text">Email me a copy of my responses</span>
              </label>
              {form.shared.sendCopy && (
                <input
                  type="email"
                  id="responseEmail"
                  value={form.shared.responseEmail}
                  onChange={(e) => setSharedField('responseEmail', e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              )}
            </div>
          </div>

          {formError && <p className="lookup-error">{formError}</p>}

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit RSVP'}
          </button>
        </form>
      )}
      </div>
    </div>
  );
}

export default RSVP;
