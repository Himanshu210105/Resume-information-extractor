// ═══════════════════════════════════════════════════════════════
//  RESUME NLP ENGINE v3
//  FIXES:
//  1. Name works even in ALL CAPS ("SHOURYA KAPOOR")
//  2. Skills no longer bleed into Certifications
//  3. Summary no longer swallows Education/other sections
//  4. Much more robust section detection
// ═══════════════════════════════════════════════════════════════

// ── Known section header patterns ─────────────────────────────
// Each pattern ONLY matches if the ENTIRE line (or start) is a heading
const SECTION_MAP = [
  { key: 'summary',        rx: /^(professional\s+)?summary$|^objective$|^career\s+objective$|^profile$|^about\s+(me)?$|^overview$|^professional\s+profile$/i },
  { key: 'education',      rx: /^education(al\s+qualification)?$|^academic(s|\s+background)?$|^qualifications?$|^schooling$|^academic\s+details$/i },
  { key: 'experience',     rx: /^(work\s+)?(experience|history)$|^employment(\s+history)?$|^professional\s+experience$|^internship(s)?$|^work\s+experience$/i },
  { key: 'skills',         rx: /^(technical\s+)?skills?$|^core\s+competencies$|^technologies$|^tech\s+stack$|^competencies$|^expertise$|^skill\s+set$|^areas?\s+of\s+(interest|expertise)$|^tools?\s+(and|&)\s+technologies?$|^programming\s+languages?$|^technical\s+expertise$/i },
  { key: 'projects',       rx: /^projects?$|^personal\s+projects?$|^academic\s+projects?$|^key\s+projects?$|^project\s+work$/i },
  { key: 'certifications', rx: /^certifications?$|^courses?$|^training$|^licenses?$|^credentials?$|^online\s+courses?$|^professional\s+certifications?$/i },
  { key: 'languages',      rx: /^languages?$|^known\s+languages?$|^language\s+skills?$|^communication\s+languages?$|^spoken\s+languages?$/i },
  { key: 'achievements',   rx: /^achievements?$|^awards?$|^honors?$|^accomplishments?$|^recognitions?$|^extra.?curricular$/i },
  { key: 'links',          rx: /^links?$|^profiles?$|^online\s+presence$|^social\s+media$|^portfolio$|^web\s+presence$/i },
  { key: 'contact',        rx: /^contact(\s+info(rmation)?)?$|^personal\s+info(rmation)?$|^reach\s+me$/i },
];

// ── Normalize text: fix common PDF extraction issues ──────────
function normalizeText(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Fix broken words from PDF (e.g. "Sc ience" → "Science")
    .replace(/([a-z])\s([a-z])/g, (m, a, b) => {
      // Only join if both are lowercase and short gap — likely broken word
      return a + b;
    })
    // Remove weird unicode
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\x7F\n]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}

// ── Split resume into sections ─────────────────────────────────
export function parseSections(text) {
  const lines = text.split('\n');
  const sections = { _header: [] };
  let current = '_header';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // A section header must be:
    // - Reasonably short (< 55 chars)
    // - Match one of our section patterns
    let matched = false;
    if (line.length < 55) {
      // Strip trailing colon/dash for matching
      const stripped = line.replace(/[:\-–—]+$/, '').trim();
      for (const { key, rx } of SECTION_MAP) {
        if (rx.test(stripped)) {
          current = key;
          if (!sections[key]) sections[key] = [];
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      if (!sections[current]) sections[current] = [];
      sections[current].push(line);
    }
  }
  return sections;
}

// ── Extract name — handles ALL CAPS, Mixed Case, lowercase ────
export function extractName(headerLines) {
  // Words to skip if they appear in what looks like a name line
  const skipRx = /engineer|developer|manager|analyst|designer|intern|student|btech|b\.tech|mtech|m\.tech|mca|bca|resume|curriculum|vitae|profile|contact|email|phone|address|@|http|linkedin|github|\.com|\.in|\d{5,}|university|institute|school|college|class|science|engineering|technology|computer|artificial|intelligence|machine|learning/i;

  for (const line of headerLines.slice(0, 12)) {
    // Normalize: trim, remove separators
    const clean = line.replace(/[|•·,\-–—]/g, ' ').replace(/\s+/g, ' ').trim();

    // Convert to title case for matching (handles ALL CAPS names)
    const words = clean.split(' ').filter(w => w.length > 0);

    if (words.length < 2 || words.length > 4) continue;
    if (skipRx.test(clean)) continue;
    // All words must be alphabetic only
    if (!words.every(w => /^[A-Za-z]+$/.test(w))) continue;
    // In proper name, no word should be a common English word
    const commonWords = /^(the|and|for|with|from|that|this|have|will|your|our|their|about|more|some|been|were|they|when|what|which|there|these|those|would|could|should|also|into|than|then|such|like|well|just|over|back|only|even|much|both|same|however|therefore|whereas)$/i;
    if (words.some(w => commonWords.test(w))) continue;

    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
  return '';
}

// ── Extract title/designation ─────────────────────────────────
export function extractTitle(headerLines, name) {
  const titleRx = /engineer|developer|analyst|designer|manager|scientist|architect|consultant|specialist|programmer|intern|student|researcher|lead|director|b\.?\s*tech|m\.?\s*tech|mca|bca|bsc|msc|b\.?\s*e\b|m\.?\s*e\b|computer\s+science|artificial\s+intelligence|machine\s+learning|data\s+science|information\s+technology/i;
  const nameLower = name.toLowerCase();
  for (const line of headerLines.slice(0, 15)) {
    if (line.toLowerCase() === nameLower) continue;
    if (line.includes('@') || /^\+?\d/.test(line)) continue;
    if (titleRx.test(line) && line.length > 4 && line.length < 150) {
      return line.replace(/^[•\-*▸]\s*/, '').trim();
    }
  }
  return '';
}

// ── Extract all contact fields ─────────────────────────────────
export function extractContact(allText, sections) {
  // Email
  const emailM = allText.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,6}/);

  // Phone — more flexible: 10 digits, with or without country code
  const phoneM = allText.match(/(\+?91[\s-]?)?[6-9]\d{9}/)
    || allText.match(/(\+?[\d][\d\s().-]{8,15}[\d])/);

  // LinkedIn
  const linkedinM = allText.match(/linkedin\.com\/in\/([\w-]+)/i)
    || allText.match(/linkedin[:\s]+([a-zA-Z0-9_-]+)/i);

  // GitHub
  const githubM = allText.match(/github\.com\/([\w-]+)/i)
    || allText.match(/github[:\s]+([\w-]+)/i);

  // Website
  const websiteM = allText.match(/https?:\/\/(?!linkedin|github|mailto)[\w.\-/%?=&]+/i);

  // Location — Indian cities + general pattern
  const cities = 'Chennai|Mumbai|Delhi|New Delhi|Bengaluru|Bangalore|Hyderabad|Pune|Kolkata|Kochi|Coimbatore|Madurai|Trichy|Vellore|Ahmedabad|Jaipur|Lucknow|Chandigarh|Shahjahanpur|Kanpur|Noida|Gurgaon|Gurugram|Agra|Varanasi|Surat|Vadodara|Nagpur|Bhopal|Indore|Ramapuram|New York|London|San Francisco|Berlin|Toronto|Singapore|Dubai|Remote';
  const locationM = allText.match(new RegExp(`\\b(${cities})\\b`, 'i'))
    || allText.match(/\b([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)?)\s*[,–-]\s*(India|USA|UK|Canada|Australia|Germany|UAE|Remote)\b/);

  return {
    email: emailM ? emailM[0] : '',
    phone: phoneM ? phoneM[0].replace(/\s+/g, '') : '',
    location: locationM ? locationM[0] : '',
    linkedin: linkedinM ? (linkedinM[1] ? `linkedin.com/in/${linkedinM[1]}` : linkedinM[0]) : '',
    github: githubM ? (githubM[1] && githubM[1].length > 1 ? `github.com/${githubM[1]}` : githubM[0]) : '',
    website: websiteM ? websiteM[0] : '',
  };
}

// ── Extract links (plain text mentions) ───────────────────────
export function extractLinks(sections, allText) {
  const links = [];
  const seen = new Set();

  const addLink = (label, url) => {
    if (seen.has(label)) return;
    seen.add(label);
    links.push({ label, url });
  };

  // Actual URLs
  const urls = allText.match(/https?:\/\/[\w.\-/%?=&@#]+/g) || [];
  urls.forEach(url => {
    if (/linkedin/i.test(url)) addLink('LinkedIn', url);
    else if (/github/i.test(url)) addLink('GitHub', url);
    else if (/leetcode/i.test(url)) addLink('LeetCode', url);
    else if (/portfolio|vercel|netlify/i.test(url)) addLink('Portfolio', url);
    else addLink('Website', url);
  });

  // Plain text mentions without URLs
  const combined = [...(sections.links || []), ...(sections._header || [])].join('\n');
  if (/linkedin/i.test(combined) && !seen.has('LinkedIn')) addLink('LinkedIn', '');
  if (/github/i.test(combined) && !seen.has('GitHub')) addLink('GitHub', '');
  if (/leetcode/i.test(combined) && !seen.has('LeetCode')) addLink('LeetCode', '');
  if (/portfolio/i.test(combined) && !seen.has('Portfolio')) addLink('Portfolio', '');

  return links;
}

// ── Extract languages ─────────────────────────────────────────
export function extractLanguages(sections, allText) {
  const KNOWN_LANGS = /\b(English|Hindi|Tamil|Telugu|Kannada|Malayalam|Bengali|Marathi|Urdu|Gujarati|Punjabi|Sanskrit|French|German|Spanish|Italian|Portuguese|Russian|Chinese|Mandarin|Japanese|Korean|Arabic|Dutch|Swedish|Turkish|Persian|Swahili)\b/gi;

  const PROF_MAP = {
    'professional working proficiency': { label: 'Professional', level: 75 },
    'limited working proficiency': { label: 'Limited Working', level: 40 },
    'native or bilingual': { label: 'Native', level: 100 },
    'full professional': { label: 'Professional', level: 80 },
    native: { label: 'Native', level: 100 },
    bilingual: { label: 'Bilingual', level: 100 },
    fluent: { label: 'Fluent', level: 85 },
    advanced: { label: 'Advanced', level: 80 },
    professional: { label: 'Professional', level: 75 },
    conversational: { label: 'Conversational', level: 60 },
    intermediate: { label: 'Intermediate', level: 55 },
    limited: { label: 'Limited', level: 40 },
    basic: { label: 'Basic', level: 30 },
    beginner: { label: 'Beginner', level: 20 },
    elementary: { label: 'Elementary', level: 15 },
  };

  // Search language section first, then full text
  const searchText = [
    ...(sections.languages || []),
    ...(sections._header || []),
  ].join('\n');

  const finalText = searchText.length > 10 ? searchText : allText;
  const results = [];
  const seen = new Set();

  const matches = [...finalText.matchAll(KNOWN_LANGS)];
  for (const m of matches) {
    const lang = m[0];
    if (seen.has(lang.toLowerCase())) continue;
    seen.add(lang.toLowerCase());

    const idx = finalText.indexOf(lang);
    const context = finalText.slice(Math.max(0, idx - 5), idx + 120).toLowerCase();

    let prof = { label: 'Known', level: 50 };

    // Check bracket format first: [Professional Working Proficiency]
    const bracketM = finalText.slice(idx).match(/\[([^\]]+)\]/);
    if (bracketM) {
      const bt = bracketM[1].toLowerCase();
      for (const [key, val] of Object.entries(PROF_MAP)) {
        if (bt.includes(key.split(' ')[0])) { prof = val; break; }
      }
    } else {
      // Check nearby context
      for (const [key, val] of Object.entries(PROF_MAP)) {
        if (context.includes(key)) { prof = val; break; }
      }
    }

    results.push({ language: lang, proficiency: prof.label, level: prof.level });
  }

  return results;
}

// ── Extract skills ─────────────────────────────────────────────
export function extractSkills(sections) {
  // ONLY use the skills section — never bleed into other sections
  const skillLines = sections.skills || [];
  if (!skillLines.length) return { technical: [], frameworks: [], tools: [], aiml: [], databases: [], devops: [], other: [] };

  const raw = skillLines.join(', ');

  // Split on delimiters
  const tokens = raw
    .split(/[,|•·;/\n\t]/)
    .map(s => s.replace(/^[-–—*▸➤→\s]+/, '').replace(/[-–—*▸➤→\s]+$/, '').replace(/\s+/g, ' ').trim())
    .filter(s =>
      s.length > 0 && s.length < 50 &&
      !/^\d+$/.test(s) &&
      !/^(and|the|with|for|in|of|to|a|an|etc|including|such|as|using|via|tools?|technologies|languages?|frameworks?|skills?|areas?\s+of|programming|technical|core\s+competencies|proficient|familiar|knowledge|experience)$/i.test(s) &&
      !/^(technical|non.?technical|soft\s+skills?|hard\s+skills?)$/i.test(s)
    );

  const technical = [], frameworks = [], tools = [], aiml = [], databases = [], devops = [], other = [];
  const seen = new Set();

  const AIML_RX = /tensorflow|pytorch|keras|scikit[-\s]?learn|sklearn|pandas|numpy|nlp|natural\s*language|machine\s*learning|deep\s*learning|bert|transformers?|llm|gpt|hugging\s*face|opencv|spacy|nltk|langchain|computer\s*vision/i;
  const DEVOPS_RX = /\baws\b|azure|gcp|google\s*cloud|kubernetes|k8s|ci\/cd|jenkins|terraform|ansible|heroku|vercel|netlify|nginx|apache|linux\b/i;
  const DB_RX = /\bsql\b|mysql|postgresql|postgres|sqlite|mongodb|mongo\b|redis|firebase|dynamodb|cassandra|oracle|nosql|supabase|mariadb/i;
  const FRAMEWORK_RX = /\breact\b|react\.?js|angular|vue\.?js|next\.?js|nextjs|nuxt|svelte|django|flask|fastapi|express\.?js|spring|laravel|rails|flutter|ionic|tailwind|bootstrap|material.ui|chakra/i;
  const TOOL_RX = /\bgit\b|github|gitlab|bitbucket|vs\s*code|vscode|visual\s*studio\b|jupyter|colab|postman|figma|jira|confluence|slack|notion|trello|jenkins|npm|yarn|webpack|vite|maven|gradle|docker\b|canva|figma/i;
  const LANG_RX = /^(python|java|javascript|js|typescript|ts|c\+\+|c#|ruby|golang|go|rust|php|scala|swift|kotlin|r|bash|shell|html|css|sass|scss|c\b|matlab|dart|perl|haskell|lua|assembly)$/i;

  for (const raw of tokens) {
    const t = raw.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());

    if (AIML_RX.test(t)) aiml.push(t);
    else if (DEVOPS_RX.test(t)) devops.push(t);
    else if (DB_RX.test(t)) databases.push(t);
    else if (FRAMEWORK_RX.test(t)) frameworks.push(t);
    else if (TOOL_RX.test(t)) tools.push(t);
    else if (LANG_RX.test(t)) technical.push(t);
    else other.push(t);
  }

  return { technical, frameworks, tools, aiml, databases, devops, other };
}

// ── Extract experience ─────────────────────────────────────────
export function extractExperience(sections) {
  const lines = sections.experience || [];
  if (!lines.length) return [];

  const DATE_RX = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s*\d{2,4}\s*[-–—to]+\s*(present|current|now|till\s*date|\w+\.?\s*\d{2,4})/gi;

  const jobs = [];
  let cur = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateM = line.match(DATE_RX);
    if (dateM) {
      if (cur) jobs.push(cur);
      const beforeDate = line.replace(DATE_RX, '').replace(/[|\-–—]/g, ' ').trim();
      cur = {
        role: beforeDate || (i > 0 ? lines[i - 1] : ''),
        company: beforeDate ? (i > 0 ? lines[i - 1] : '') : '',
        duration: dateM[0],
        location: '',
        highlights: [],
        technologies: []
      };
    } else if (cur) {
      const clean = line.replace(/^[•\-*▸➤→]\s*/, '').trim();
      if (line.match(/^[•\-*▸➤→]/)) {
        cur.highlights.push(clean);
      } else if (!cur.company && line.length < 80) {
        cur.company = line;
      }
    }
  }
  if (cur && (cur.role || cur.company || cur.highlights.length)) jobs.push(cur);
  return jobs;
}

// ── Extract education ─────────────────────────────────────────
export function extractEducation(sections) {
  const lines = sections.education || [];
  if (!lines.length) return [];

  const DEG_RX = /\b(b\.?\s*tech|m\.?\s*tech|b\.?\s*e\.?|m\.?\s*e\.?|b\.?\s*sc\.?|m\.?\s*sc\.?|bca|mca|b\.?\s*com\.?|m\.?\s*com\.?|mba|ph\.?\s*d\.?|bachelor|master|doctorate|diploma|b\.?\s*a\.?|m\.?\s*a\.?|class\s+(x|xi|xii|10|11|12)|cbse|icse|hsc|ssc|matriculation|12th|10th|intermediate|secondary|senior\s+secondary)/gi;
  const YEAR_RX = /\b(19|20)\d{2}\b/g;
  const GPA_RX = /(?:cgpa|gpa|percentage|%|marks|score)[:\s-]*([\d.]+\s*%?)/i;
  const BOARD_RX = /\b(cbse|icse|state\s*board|hsc|ssc|matriculation|igcse)\b/i;

  const results = [];
  let cur = null;

  for (const line of lines) {
    const degM = line.match(DEG_RX);
    const yearM = [...line.matchAll(YEAR_RX)];
    const gpaM = line.match(GPA_RX);
    const boardM = line.match(BOARD_RX);

    if (degM || boardM) {
      if (cur) results.push(cur);
      const fieldM = line.match(/(?:in|of|–|-)\s+([A-Za-z\s&-]+?)(?:\s*[,|·]|\s*\d{4}|$)/i);
      cur = {
        degree: degM ? degM[0].trim() : (boardM ? boardM[0].trim() : ''),
        field: fieldM ? fieldM[1].trim() : '',
        institution: '',
        year: yearM.length ? yearM[yearM.length - 1][0] : '',
        startYear: yearM.length > 1 ? yearM[0][0] : '',
        gpa: gpaM ? gpaM[1].trim() : '',
        board: boardM ? boardM[0].trim() : '',
        achievements: []
      };
    } else if (cur) {
      if (!cur.institution && line.length > 2 && line.length < 120 && /[A-Za-z]/.test(line)) {
        cur.institution = line;
      }
      if (!cur.gpa) { const g = line.match(GPA_RX); if (g) cur.gpa = g[1].trim(); }
      if (!cur.year) { const y = [...line.matchAll(YEAR_RX)]; if (y.length) cur.year = y[y.length - 1][0]; }
      if (!cur.startYear) { const y = [...line.matchAll(YEAR_RX)]; if (y.length > 1) cur.startYear = y[0][0]; }
    }
  }
  if (cur) results.push(cur);

  const seen = new Set();
  return results.filter(r => {
    const k = (r.degree + r.institution).toLowerCase().slice(0, 40);
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
}

// ── Extract certifications ─────────────────────────────────────
export function extractCertifications(sections) {
  const lines = sections.certifications || [];
  const YEAR_RX = /\b(20\d{2})\b/;
  const MONTH_RX = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i;

  return lines
    .map(line => line.replace(/^[•\-*▸➤→]\s*/, '').trim())
    .filter(line => line.length > 2 && !/^certifications?$/i.test(line))
    .map(line => {
      const yearM = line.match(YEAR_RX);
      const monthM = line.match(MONTH_RX);

      // Extract issuer after | or "by" or "-"
      let name = line, issuer = '';
      const pipeIdx = line.lastIndexOf('|');
      if (pipeIdx > 0) {
        const afterPipe = line.slice(pipeIdx + 1).trim();
        // If after pipe is NOT a URL or "Link" → it's issuer
        if (!/https?:|^Link$/i.test(afterPipe)) {
          issuer = afterPipe.replace(YEAR_RX, '').replace(MONTH_RX, '').trim();
          name = line.slice(0, pipeIdx).trim();
        } else {
          name = line.slice(0, pipeIdx).trim();
        }
      } else {
        // Check "- Issuer" at end
        const dashM = line.match(/\s+[-–]\s+([A-Z][A-Za-z\s]+)$/);
        if (dashM) {
          issuer = dashM[1].trim();
          name = line.slice(0, line.lastIndexOf(dashM[0])).trim();
        }
      }

      // Clean name
      name = name
        .replace(YEAR_RX, '').replace(MONTH_RX, '')
        .replace(/\|\s*Link\s*/gi, '').replace(/\|\s*https?:\/\/\S*/gi, '')
        .replace(/\s+/g, ' ').trim();

      return name.length > 2 ? { name, issuer, year: yearM ? yearM[1] : '', month: monthM ? monthM[0] : '' } : null;
    })
    .filter(Boolean);
}

// ── Extract projects ───────────────────────────────────────────
export function extractProjects(sections) {
  const lines = sections.projects || [];
  if (!lines.length) return [];

  const TECH_RX = /\b(python|java\b|javascript|js\b|typescript|react\.?js|react\b|angular|vue\.?js|vue\b|node\.?js|django|flask|fastapi|sql|mongodb|docker|aws|nlp|machine\s*learning|css|html|next\.?js|express|spring|c\+\+|php|kotlin|swift|tensorflow|pytorch|firebase|postgresql|mysql|redis|git\b|azure|gcp|tailwind|bootstrap|flutter|type\s*script|c#|ruby)\b/gi;

  const projects = [];
  let cur = null;

  for (const line of lines) {
    const clean = line.replace(/^[•\-*▸➤→]\s*/, '').trim();
    const isBullet = /^[•\-*▸➤→]/.test(line);

    if (!isBullet && clean.length > 2 && clean.length < 100) {
      if (cur) projects.push(cur);
      const linkM = line.match(/\|\s*(https?:\/\/\S+|GitHub\s*Link|Github\s*Link|Link)/i);
      const nameOnly = line.replace(/\|.*/g, '').trim();
      cur = { name: nameOnly, description: '', tech: [], link: linkM ? linkM[1].trim() : '' };
    } else if (cur) {
      const urlM = clean.match(/https?:\/\/\S+/);
      if (urlM) { cur.link = urlM[0]; continue; }
      const techF = [...clean.matchAll(TECH_RX)].map(m => m[0]);
      if (techF.length) cur.tech.push(...techF);
      if (!cur.description && clean.length > 5) cur.description = clean;
    }
  }
  if (cur) projects.push(cur);
  return projects.map(p => ({ ...p, tech: [...new Set(p.tech)] }));
}

// ── Extract achievements ───────────────────────────────────────
export function extractAchievements(sections) {
  return (sections.achievements || [])
    .map(l => l.replace(/^[•\-*▸➤→]\s*/, '').trim())
    .filter(l => l.length > 4 && !/^achievements?$/i.test(l));
}

// ── Extract summary ────────────────────────────────────────────
export function extractSummary(sections, headerLines) {
  // ONLY use dedicated summary section if it exists
  const summaryLines = sections.summary || [];
  if (summaryLines.length > 0) {
    return summaryLines.join(' ').trim().slice(0, 500);
  }
  // Otherwise look for a long descriptive line in the header
  for (const l of headerLines) {
    if (l.length > 80 && !/^[+\d(]/.test(l) && !l.includes('@') && !l.includes('http')) {
      return l.slice(0, 500);
    }
  }
  return '';
}

// ── Completeness score ─────────────────────────────────────────
function calcCompleteness(data) {
  const checks = [
    data.personal.name, data.personal.title, data.personal.summary,
    data.contact.email, data.contact.phone, data.contact.location,
    data.contact.linkedin || data.contact.github,
    Object.values(data.skills).flat().length > 0,
    data.experience.length > 0, data.education.length > 0,
    data.certifications.length > 0, data.languages.length > 0,
    data.projects.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// ── MAIN EXPORT ────────────────────────────────────────────────
export function localNLPExtract(rawText) {
  const text = normalizeText(rawText);
  const sections = parseSections(text);
  const headerLines = sections._header || [];

  const name         = extractName(headerLines);
  const title        = extractTitle(headerLines, name);
  const contact      = extractContact(text, sections);
  const summary      = extractSummary(sections, headerLines);
  const skills       = extractSkills(sections);
  const experience   = extractExperience(sections);
  const education    = extractEducation(sections);
  const certifications = extractCertifications(sections);
  const languages    = extractLanguages(sections, text);
  const projects     = extractProjects(sections);
  const achievements = extractAchievements(sections);
  const links        = extractLinks(sections, text);

  const result = {
    personal: { name, title, summary },
    contact, links, skills, experience, education,
    certifications, languages, projects, achievements,
    meta: {
      completeness: 0,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      charCount: text.length,
      sectionsFound: Object.keys(sections).filter(k => k !== '_header' && sections[k]?.length > 0)
    }
  };
  result.meta.completeness = calcCompleteness(result);
  return result;
}

// ── Skill pill color ───────────────────────────────────────────
export function skillPillColor(cat) {
  return { technical: 'pill-blue', frameworks: 'pill-purple', tools: 'pill-gray', aiml: 'pill-cyan', databases: 'pill-green', devops: 'pill-amber', other: 'pill-rose' }[cat] || 'pill-gray';
}
