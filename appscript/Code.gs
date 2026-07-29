// ─────────────────────────────────────────────────────────────
//  Noel & Peter Wedding RSVP — Google Apps Script Backend
//  HOUSEHOLD MODEL
// ─────────────────────────────────────────────────────────────
//
//  SETUP:
//  1. Open your Google Sheet → Extensions → Apps Script
//  2. Paste this entire file, replacing any existing code
//  3. Set SHEET_NAME to match your sheet tab name (bottom of screen)
//  4. Set NOTIFICATION_EMAIL to your email address
//  5. Click Deploy → New Deployment → Web App
//     - Execute as: Me
//     - Who has access: Anyone
//  6. Copy the Web App URL and paste it into RSVP.jsx as SCRIPT_URL
//
//  SHEET COLUMN ORDER (columns A–O, header row in row 1):
//  A  Name
//  B  Guest                 ← comma-separated household members for grouping: "Megan Becksmith, Adam Becksmith"
//  C  Search Aliases        ← alternate names/nicknames for matching: "joey, joe, joey-b"
//  D  Reception RSVP
//  E  Meal Choice
//  F  Food Allergies
//  G  Song Requests
//  H  Message to Couple
//  I  Submitted At


const SHEET_NAME        = 'RSVP';            
const NOTIFICATION_EMAIL = 'thekoschs@gmail.com'; 
// Column indices (0-based)
const C = {
  NAME:                  0,
  GUEST:                 1,
  ALIASES:               2,
  RECEPTION_RSVP:        3,
  MEAL:                  4,
  FOOD_ALLERGIES:        5,
  SONG_REQUESTS:         6,
  MESSAGE:               7,
  SUBMITTED_AT:          8,
};

// ─── Router ──────────────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;
  let result;

  if (action === 'lookup') {
    result = lookup(e.parameter.q || '');
  } else if (action === 'submit') {
    result = submitRsvp(e.parameter);
  } else {
    result = { error: 'Unknown action' };
  }

  const json = JSON.stringify(result);
  const callback = e.parameter && e.parameter.callback;

  // Support JSONP when a `callback` parameter is provided so browser clients
  // can load responses via a <script> tag (useful when CORS is not available).
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${json})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Lookup ──────────────────────────────────────────────────

function normalizeSearchTokens(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function normalizeNameKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isGuestName(value) {
  return /\bguest\b/i.test(String(value || '').trim());
}

function getEditDistance(a, b, maxDistance = 2) {
  const alen = a.length;
  const blen = b.length;
  if (Math.abs(alen - blen) > maxDistance) return maxDistance + 1;
  const matrix = Array.from({ length: alen + 1 }, () => Array(blen + 1).fill(0));
  for (let i = 0; i <= alen; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= blen; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= alen; i += 1) {
    let rowMin = Infinity;
    for (let j = 1; j <= blen; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
      rowMin = Math.min(rowMin, matrix[i][j]);
    }
    if (rowMin > maxDistance) return maxDistance + 1;
  }
  return matrix[alen][blen];
}

function isSimilarToken(queryToken, targetToken) {
  if (!queryToken || !targetToken) return false;
  if (queryToken === targetToken) return true;
  if (targetToken.startsWith(queryToken) || queryToken.startsWith(targetToken)) return true;
  if (getEditDistance(queryToken, targetToken, 1) <= 1) return true;
  return false;
}

function stripGuestAndInitialTokens(tokens) {
  return tokens
    .filter((token) => token.toLowerCase() !== 'guest')
    .filter((token, index, array) => {
      if (token.length === 1 && index > 0 && index < array.length - 1) {
        return false;
      }
      return true;
    });
}

function getGuestBaseName(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/\s+/).filter(Boolean);
  const guestIndex = parts.findIndex((part) => part.toLowerCase() === 'guest');
  if (guestIndex > 0) {
    return parts.slice(0, guestIndex).join(' ');
  }

  return trimmed;
}

function getLookupGroupingKey(value) {
  return normalizeNameKey(getGuestBaseName(value));
}

function getNameMatchScore(targetValue, queryValue) {
  const normalizedQuery = normalizeSearchTokens(queryValue);
  if (normalizedQuery.length === 0) return 0;

  const normalizedTarget = normalizeSearchTokens(targetValue);
  if (normalizedTarget.length === 0) return 0;

  const targetText = normalizedTarget.join(' ');
  const queryText = normalizedQuery.join(' ');

  if (targetText === queryText) return 10;
  if (targetText.startsWith(queryText) || queryText.startsWith(targetText)) return 8;

  if (normalizedQuery.length === 1) {
    const [queryToken] = normalizedQuery;
    if (normalizedTarget.some((targetToken) => isSimilarToken(queryToken, targetToken))) return 7;
    if (normalizedTarget.some((token) => token.startsWith(queryToken))) return 5;
    return 0;
  }

  const strippedTarget = stripGuestAndInitialTokens(normalizedTarget);
  const allQueryTokensPresent = normalizedQuery.every((queryToken) =>
    strippedTarget.some((targetToken) => isSimilarToken(queryToken, targetToken))
  );

  if (allQueryTokensPresent) return 6;

  const strippedQuery = stripGuestAndInitialTokens(normalizedQuery);
  if (strippedQuery.length > 1 && strippedTarget.length > 1) {
    const queryMatches = strippedQuery.every((queryToken) =>
      strippedTarget.some((targetToken) => isSimilarToken(queryToken, targetToken))
    );
    if (queryMatches) return 5;
  }

  return 0;
}

function lookup(query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return { matches: [] };


  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows  = sheet.getDataRange().getValues();

  // Build fast lookup maps once per request.
  const rowIndexByName = new Map();
  const groupingMap = new Map();

  for (let i = 1; i < rows.length; i++) {
    const nameKey = normalizeNameKey(rows[i][C.NAME]);
    if (!nameKey || rowIndexByName.has(nameKey)) continue;
    rowIndexByName.set(nameKey, i);

    const groupKey = getLookupGroupingKey(rows[i][C.NAME]);
    if (!groupingMap.has(groupKey)) {
      groupingMap.set(groupKey, []);
    }
    groupingMap.get(groupKey).push(i);
  }

  // Find matching people by name/aliases
  const rankedMatches = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[C.NAME]) continue;

    const name    = String(row[C.NAME]).toLowerCase();
    const aliases = String(row[C.ALIASES] || '')
      .toLowerCase()
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    const targets = [name, ...aliases];
    let score = 0;

    for (const t of targets) {
      if (!t) continue;
      score = Math.max(score, getNameMatchScore(t, q));
      if (score >= 10) break;
    }

    if (score > 0) {
      rankedMatches.push({ rowIndex: i, score });
    }
  }

  if (rankedMatches.length === 0) return { matches: [] };

  rankedMatches.sort((a, b) => b.score - a.score);

  // Keep all top-score matches (helps Sr/Jr/II variants), then fill up to 8.
  const topScore = rankedMatches[0].score;
  const topScoreMatches = rankedMatches.filter(m => m.score === topScore);
  const restMatches = rankedMatches.filter(m => m.score !== topScore);

  // Also prioritize direct name startsWith matches (e.g., multiple "Lisa ..." rows).
  const startsWithMatches = rankedMatches.filter(({ rowIndex }) => {
    const name = String(rows[rowIndex][C.NAME] || '').toLowerCase();
    return name.startsWith(q);
  });

  const topMatches = [];
  const seen = new Set();
  for (const m of [...topScoreMatches, ...startsWithMatches, ...restMatches]) {
    if (!seen.has(m.rowIndex)) {
      seen.add(m.rowIndex);
      topMatches.push(m);
    }
    if (topMatches.length >= 8) break;
  }

  const groupedResults = [];
  const seenGroupKeys = new Set();

  for (const match of topMatches) {
    const matchRowIndex = match.rowIndex;
    const groupKey = getLookupGroupingKey(rows[matchRowIndex][C.NAME]);
    if (seenGroupKeys.has(groupKey)) continue;
    seenGroupKeys.add(groupKey);

    const groupedRowIndices = groupingMap.get(groupKey) || [];

    const orderedRowIndices = groupedRowIndices.slice().sort((a, b) => {
      const aGuest = isGuestName(String(rows[a][C.NAME] || '')) ? 1 : 0;
      const bGuest = isGuestName(String(rows[b][C.NAME] || '')) ? 1 : 0;
      return aGuest - bGuest || a - b;
    });

    const primaryRowIndex = orderedRowIndices.find((idx) => !isGuestName(String(rows[idx][C.NAME] || ''))) || orderedRowIndices[0];
    const matchedRow = rows[primaryRowIndex];
    const matchedName = String(matchedRow[C.NAME]);
    const guestName = String(matchedRow[C.GUEST] || '').trim();
    const guestMembers = String(matchedRow[C.GUEST] || '')
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    const aliasMembers = String(matchedRow[C.ALIASES] || '')
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    // Prefer Guest whenever present (including a single plus-one), otherwise fallback to Aliases.
    const householdMembers = guestMembers.length > 0 ? guestMembers : aliasMembers;

    const familyMembers = [];
    const seenRowIndices = new Set();

    for (const rowIndex of orderedRowIndices) {
      const row = rows[rowIndex];
      if (!row || !row[C.NAME]) continue;

      familyMembers.push({
        rowIndex,
        name: String(row[C.NAME]),
        alreadySubmitted: !!row[C.SUBMITTED_AT],
        existing: {
          receptionRsvp: String(row[C.RECEPTION_RSVP] || ''),
          meal: String(row[C.MEAL] || ''),
          foodAllergies: String(row[C.FOOD_ALLERGIES] || ''),
        },
      });
      seenRowIndices.add(rowIndex);
    }

    // Add household members from primary grouping source (Guest or Aliases fallback)
    for (const householdName of householdMembers) {
      const householdRowIndex = rowIndexByName.get(normalizeNameKey(householdName));
      if (householdRowIndex == null || seenRowIndices.has(householdRowIndex)) {
        // If there is a household member name listed (e.g., a guest) but no
        // matching sheet row, include a placeholder member entry so the
        // client can display the guest name alongside household members.
        if (householdName && String(householdName).trim()) {
          const guestNameOnly = String(householdName).trim();
          // Avoid duplicating guest placeholders by name
          const alreadyHasPlaceholder = familyMembers.some(
            m => m.isGuestPlaceholder && m.name === guestNameOnly
          );
          if (!alreadyHasPlaceholder) {
            familyMembers.push({
              rowIndex: -1,
              name: guestNameOnly,
              alreadySubmitted: false,
              existing: {
                receptionRsvp: '',
                meal: '',
                foodAllergies: '',
              },
              isGuestPlaceholder: true,
            });
          }
        }
        continue;
      }

      const row = rows[householdRowIndex];
      if (!row || !row[C.NAME]) continue;

      familyMembers.push({
        rowIndex: householdRowIndex,
        name: String(row[C.NAME]),
        alreadySubmitted: !!row[C.SUBMITTED_AT],
        existing: {
          receptionRsvp: String(row[C.RECEPTION_RSVP] || ''),
          meal: String(row[C.MEAL] || ''),
          foodAllergies: String(row[C.FOOD_ALLERGIES] || ''),
        },
      });
      seenRowIndices.add(householdRowIndex);
    }

    let sharedSongRequests = '';
    let sharedMessage = '';
    for (const member of familyMembers) {
      const sourceRow = rows[member.rowIndex] || [];
      const songValue = String(sourceRow[C.SONG_REQUESTS] || '').trim();
      const msgValue = String(sourceRow[C.MESSAGE] || '').trim();
      if (songValue || msgValue) {
        sharedSongRequests = songValue;
        sharedMessage = msgValue;
        break;
      }
    }

    groupedResults.push({
      members: familyMembers,
      matchedName,
      guestName,
      shared: {
        songRequests: sharedSongRequests,
        message: sharedMessage,
      },
    });
  }

  return {
    matches: groupedResults,
  };
}

// ─── Submit ──────────────────────────────────────────────────

function getHeaderColumnIndex(sheet, headerName) {
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const normalized = String(headerName || '').trim().toLowerCase();

  for (let i = 0; i < headerRow.length; i++) {
    if (String(headerRow[i] || '').trim().toLowerCase() === normalized) {
      return i;
    }
  }

  return -1;
}

function submitRsvp(p) {
  const sheet    = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const guestNameColumnIndex = getHeaderColumnIndex(sheet, 'Guest Name');
  const guestRsvpColumnIndex = getHeaderColumnIndex(sheet, 'Guest RSVP');

  const headerCheck = validateSheetHeaders(sheet);
  if (!headerCheck.ok) {
    return {
      success: false,
      error: `Sheet columns do not match expected layout. ${headerCheck.message}`,
    };
  }

  // p.members is an array like [{ rowIndex: 1, name: 'Sarah', ... }, { rowIndex: 2, name: 'Mike', ... }, ...]
  const members = JSON.parse(p.members);
  const allRows = sheet.getDataRange().getValues();

  // Find guest and partner members
  const guestMember = members.find(m => isGuestName(m.name));
  const partnerMember = members.find(m => !isGuestName(m.name));
  const guestName = String(p.guestName || '').trim();

  for (const member of members) {
    // Skip placeholder members that have no sheet row (rowIndex === -1).
    if (member.rowIndex === -1) continue;
    const mKey = `member_${member.rowIndex}`;
    writePersonRow(sheet, member.rowIndex, {
      receptionRsvp:      p[`${mKey}_receptionRsvp`]  || '',
      meal:               p[`${mKey}_meal`]           || '',
      foodAllergies:      p[`${mKey}_foodAllergies`]  || '',
      guestName:          guestName,
      guestRsvp:          p.guestRsvp || '',
      guestNameColumnIndex,
      guestRsvpColumnIndex,
      timestamp,
      isGuest:            isGuestName(member.name),
    });
  }

  // If guest name was provided, update household lists to replace guest placeholder
  if (guestName && guestMember && partnerMember) {
    const guestRowIndex = guestMember.rowIndex;
    const partnerRowIndex = partnerMember.rowIndex;

    // Update guest row's household list (B column)
    const guestHouseholdRaw = String(allRows[guestRowIndex][C.GUEST] || '');
    const guestHouseholdUpdated = guestHouseholdRaw
      .split(',')
      .map(name => {
        const trimmed = name.trim();
        return isGuestName(trimmed) ? guestName : trimmed;
      })
      .join(', ');
    sheet.getRange(guestRowIndex + 1, C.GUEST + 1).setValue(guestHouseholdUpdated);

    // Update partner row's household list (B column)
    const partnerHouseholdRaw = String(allRows[partnerRowIndex][C.GUEST] || '');
    const partnerHouseholdUpdated = partnerHouseholdRaw
      .split(',')
      .map(name => {
        const trimmed = name.trim();
        return isGuestName(trimmed) ? guestName : trimmed;
      })
      .join(', ');
    sheet.getRange(partnerRowIndex + 1, C.GUEST + 1).setValue(partnerHouseholdUpdated);
  }

  // Write shared fields (song requests, message) to every selected member row
  for (const member of members) {
    if (member.rowIndex === -1) continue; // skip placeholder members
    const sheetRow = member.rowIndex + 1;
    sheet.getRange(sheetRow, C.SONG_REQUESTS + 1).setValue(p.songRequests || '');
    sheet.getRange(sheetRow, C.MESSAGE + 1).setValue(p.message || '');
  }

  sendNotificationEmail(p, members);
  sendGuestCopyEmail(p, members);
  return { success: true };
}

function writePersonRow(sheet, rowIndex, data) {
  const sheetRow = rowIndex + 1; // 0-based → 1-based

  const existingRow = sheet
    .getRange(sheetRow, 1, 1, C.SUBMITTED_AT + 1)
    .getValues()[0];

  const pick = (incoming, existingColIndex) => {
    const v = String(incoming == null ? '' : incoming).trim();
    if (v === '') return existingRow[existingColIndex] || '';
    return incoming;
  };

  const updates = [
    [C.RECEPTION_RSVP + 1, pick(data.receptionRsvp, C.RECEPTION_RSVP) ],
    [C.MEAL           + 1, pick(data.meal, C.MEAL)                     ],
    [C.FOOD_ALLERGIES + 1, pick(data.foodAllergies, C.FOOD_ALLERGIES)  ],
  ];

  // If this is a guest row and guest name was provided, update ONLY the name cell
  if (data.guestName && data.isGuest) {
    updates.unshift([C.NAME + 1, data.guestName]);
  }

  if (data.guestNameColumnIndex >= 0) {
    updates.push([data.guestNameColumnIndex + 1, pick(data.guestName, data.guestNameColumnIndex)]);
  }
  if (data.guestRsvpColumnIndex >= 0) {
    updates.push([data.guestRsvpColumnIndex + 1, pick(data.guestRsvp, data.guestRsvpColumnIndex)]);
  }
  updates.push([C.SUBMITTED_AT + 1, data.timestamp]);
  for (const [col, val] of updates) {
    sheet.getRange(sheetRow, col).setValue(val);
  }
}

function validateSheetHeaders(sheet) {
  const expectedHeaders = [
    'Name',
    'Guest',
    'Search Aliases',
    'Reception RSVP',
    'Meal Choice',
    'Food Allergies',
    'Song Requests',
    'Message to Couple',
    'Submitted At',
  ];
  const optionalHeaders = ['Guest Name', 'Guest RSVP'];

  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const normalize = (v) => String(v || '').trim().toLowerCase();

  for (let i = 0; i < expectedHeaders.length; i++) {
    if (normalize(headerRow[i]) !== normalize(expectedHeaders[i])) {
      return {
        ok: false,
        message: `Column ${i + 1} expected "${expectedHeaders[i]}" but found "${headerRow[i] || '(blank)'}".`,
      };
    }
  }

  for (let i = 0; i < optionalHeaders.length; i++) {
    const header = optionalHeaders[i];
    const exists = headerRow.some((value) => normalize(value) === normalize(header));
    if (!exists) continue;
  }

  return { ok: true };
}

// ─── Household name formatter ────────────────────────────────

function formatHouseholdNamesWithGuest(members, guestName) {
  if (!members || members.length === 0) return '';
  
  const partner = members.find(m => !isGuestName(m.name));
  const guest = members.find(m => isGuestName(m.name));
  
  if (partner && guest && guestName) {
    return `${partner.name} and ${guestName}`;
  }
  
  return formatHouseholdNames(members);
}

function formatHouseholdNames(members) {
  if (!members || members.length === 0) return '';
  if (members.length === 1) return members[0].name;

  const suffixes = new Set(['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v']);

  const getFamilyLastName = (fullName) => {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) return '';
    const tail = parts[parts.length - 1].toLowerCase();
    const lastIdx = suffixes.has(tail) ? parts.length - 2 : parts.length - 1;
    return (parts[lastIdx] || '').toLowerCase();
  };

  const parsed = members.map(m => {
    const parts = m.name.trim().split(/\s+/);
    return {
      name: m.name,
      first: parts[0],
      familyLast: getFamilyLastName(m.name),
    };
  });

  const familyLastNames = parsed.map(p => p.familyLast).filter(Boolean);
  const allSameLastName = familyLastNames.length === parsed.length
    && familyLastNames.every(ln => ln === familyLastNames[0]);

  if (allSameLastName && familyLastNames[0]) {
    const displayLast = familyLastNames[0].charAt(0).toUpperCase() + familyLastNames[0].slice(1);
    if (parsed.length >= 3) return `The ${displayLast} Family`;
    const firstNames = parsed.map(p => p.first).join(' and ');
    return `${firstNames} ${displayLast}`;
  }

  return members.map(m => m.name).join(' and ');
}

// ─── Email Notification ──────────────────────────────────────

function sendNotificationEmail(p, members) {
  const guestName = String(p.guestName || '').trim();
  const householdNames = formatHouseholdNamesWithGuest(members, guestName);
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const htmlBody = buildRsvpHtmlEmail({
    headerLabel: 'New RSVP Received',
    subLabel: null,
    householdNames,
    timestamp,
    p,
    members,
    isGuestCopy: false,
  });

  MailApp.sendEmail({
    to:       NOTIFICATION_EMAIL,
    subject:  `RSVP: ${householdNames}`,
    body:     buildRsvpPlainText(householdNames, timestamp, p, members),
    htmlBody,
  });
}

function sendGuestCopyEmail(p, members) {
  const wantsCopy = String(p.sendCopy || '').trim().toLowerCase() === 'yes';
  const guestEmail = String(p.responseEmail || '').trim();
  if (!wantsCopy || !guestEmail) return;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(guestEmail)) return;

  const guestName = String(p.guestName || '').trim();
  const householdNames = formatHouseholdNamesWithGuest(members, guestName);
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const htmlBody = buildRsvpHtmlEmail({
    headerLabel: 'Your RSVP is confirmed',
    subLabel: 'We can\'t wait to celebrate with you in South Bend.',
    householdNames,
    timestamp,
    p,
    members,
    isGuestCopy: true,
  });

  MailApp.sendEmail({
    to:       guestEmail,
    subject:  `Your RSVP — Claire & Brian`,
    body:     buildRsvpPlainText(householdNames, timestamp, p, members),
    htmlBody,
  });
}

// ── Plain-text fallback ───────────────────────────────────────

function buildRsvpPlainText(householdNames, timestamp, p, members) {
  let eventDetails = '';
  for (const member of members) {
    const mKey = `member_${member.rowIndex}`;
    eventDetails += `${member.name}:\n`;
    eventDetails += `  Reception: ${p[`${mKey}_receptionRsvp`] || '—'}\n`;
    if (p[`${mKey}_meal`]) eventDetails += `  Meal: ${p[`${mKey}_meal`]}\n`;
    if (p[`${mKey}_foodAllergies`]) eventDetails += `  Allergies: ${p[`${mKey}_foodAllergies`]}\n`;
    eventDetails += '\n';
  }
  const guestLine = p.guestName ? `Guest: ${p.guestName}\n` : '';
  const guestRsvpLine = p.guestRsvp ? `Guest RSVP: ${p.guestRsvp}\n` : '';
  return `RSVP from ${householdNames}\nSubmitted: ${timestamp}\n${guestLine}${guestRsvpLine}\n${eventDetails}\nSong Requests: ${p.songRequests || 'None'}\nMessage: ${p.message || 'None'}`;
}

// ── HTML email builder ────────────────────────────────────────

function buildRsvpHtmlEmail({ headerLabel, subLabel, householdNames, timestamp, p, members, isGuestCopy }) {
  const rsvpBadge = (val) => {
    if (!val || val === '—') return '<span style="color:#9ca3af;">—</span>';
    const yes = val === 'Yes';
    const color = yes ? '#6c8b19' : '#b00020';
    const bg    = yes ? '#f0f5e8' : '#fdf2f2';
    return `<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;letter-spacing:0.05em;background:${bg};color:${color};">${val}</span>`;
  };

  const esc = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  let memberRows = '';
  for (const member of members) {
    const mKey = `member_${member.rowIndex}`;
    const mealRow = p[`${mKey}_meal`]
      ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Meal</td><td style="padding:6px 0;text-align:right;color:#003256;font-size:13px;">${esc(p[`${mKey}_meal`])}</td></tr>` : '';
    const allergyRow = p[`${mKey}_foodAllergies`]
      ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Allergies</td><td style="padding:6px 0;text-align:right;color:#003256;font-size:13px;">${esc(p[`${mKey}_foodAllergies`])}</td></tr>` : '';

    memberRows += `
      <div style="margin-bottom:20px;">
        <div style="font-family:Georgia,serif;font-size:15px;font-weight:600;color:#003256;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-bottom:8px;">${esc(member.name)}</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Reception</td><td style="padding:6px 0;text-align:right;">${rsvpBadge(p[`${mKey}_receptionRsvp`])}</td></tr>
          ${mealRow}${allergyRow}
        </table>
      </div>`;
  }

  const guestRow = p.guestName
    ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Guest</td><td style="padding:6px 0;text-align:right;color:#003256;font-size:13px;">${esc(p.guestName)}</td></tr>`
    : '';
  const guestRsvpRow = p.guestRsvp
    ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Guest RSVP</td><td style="padding:6px 0;text-align:right;color:#003256;font-size:13px;">${esc(p.guestRsvp)}</td></tr>`
    : '';
  const notesSection = (p.songRequests || p.message || guestRow || guestRsvpRow) ? `
      <div style="margin-bottom:20px;">
        <div style="font-family:Georgia,serif;font-size:15px;font-weight:600;color:#003256;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-bottom:8px;">Notes</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
          ${guestRow}
          ${guestRsvpRow}
          ${p.songRequests ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Song Request</td><td style="padding:6px 0;text-align:right;color:#003256;font-size:13px;">${esc(p.songRequests)}</td></tr>` : ''}
          ${p.message ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Message</td><td style="padding:6px 0;text-align:right;color:#003256;font-size:13px;">${esc(p.message)}</td></tr>` : ''}
        </table>
      </div>` : '';

  const subLabelHtml = subLabel
    ? `<p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#65b8d4;">${esc(subLabel)}</p>`
    : `<p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#9ca3af;">Submitted ${esc(timestamp)}</p>`;

  const footerNote = isGuestCopy
    ? 'Questions? Reach us at <a href="mailto:thekoschs@gmail.com" style="color:#65b8d4;">thekoschs@gmail.com</a>'
    : `Submitted: ${esc(timestamp)}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 16px rgba(0,50,86,0.10);">

        <!-- Header -->
        <tr><td style="background:#003256;padding:32px 32px 24px;text-align:center;">
          <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:#65b8d4;">Claire &amp; Brian · June 26th, 2027</p>
          <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#ffffff;letter-spacing:0.05em;">${esc(headerLabel)}</h1>
          ${subLabelHtml}
        </td></tr>

        <!-- Household name band -->
        <tr><td style="background:#6c8b19;padding:10px 32px;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">${esc(householdNames)}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 32px 8px;">
          ${memberRows}
          ${notesSection}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#9ca3af;text-align:center;">${footerNote}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
