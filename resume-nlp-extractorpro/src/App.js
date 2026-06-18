import React, { useState, useCallback, useRef } from 'react';
import { localNLPExtract } from './utils/nlpEngine';
import { apiExtract } from './utils/apiService';
import { extractTextFromPDF } from './utils/pdfReader';
import './index.css';

// ─── SAMPLE ──────────────────────────────────────────────────
const SAMPLE = `RAHUL SHARMA
rahul.sharma@email.com | +91-9876543210 | Chennai, India
github.com/rahulsharma | linkedin.com/in/rahulsharma

SUMMARY
Passionate AI/ML student with hands-on experience building web applications and ML models. Skilled in Python, React, and NLP. Seeking opportunities to apply technical knowledge in real-world projects.

EDUCATION
B.Tech Computer Science and Engineering - AI and Machine Learning
SRM Institute of Science and Technology | 2023 – 2027 | CGPA: 9.35

Class XII - CBSE - PCM
Ryan International School | 2023 | Percentage: 82%

Class X - CBSE
Ryan International School | 2021 | Percentage: 71%

SKILLS
Technical: Python, Java, JavaScript, C++, HTML, CSS
Frameworks: React.js, Next.js, Django, Flask, Tailwind CSS
Tools: Git, GitHub, VS Code, Figma, Canva, Postman
Databases: MySQL, PostgreSQL
AI/ML: Machine Learning, NLP, TensorFlow, Scikit-learn

PROJECTS
Resume NLP Parser | GitHub Link
An intelligent system using Named Entity Recognition to extract structured data from resumes.
Python, Flask, NLP, React

E-Commerce Sales Chatbot | GitHub Link
AI chatbot for e-commerce platforms using NLP and Machine Learning.
Python, NLP, Machine Learning, Flask

Portfolio Website | Link
Personal portfolio built with React.js showcasing all projects.
React, JavaScript, CSS, Tailwind

CERTIFICATIONS
Web Development Course | IBM | 2024
Data Structures and Algorithms in Java | Udemy | 2024
Database and SQL | Infosys Springboard | 2023
DSA in C++ | Scaler Academy | 2023

LANGUAGES
English [Professional Working Proficiency]
Hindi [Native]
German [Limited Working Proficiency]

LINKS
LinkedIn
GitHub

ACHIEVEMENTS
Winner - Smart India Hackathon 2024
Completed 100+ hours of ML coursework on Coursera
Open source contributor on GitHub`;

// ─── SMALL UI HELPERS ─────────────────────────────────────────
function CardHd({ icon, bg, title, count, countColor }) {
  return (
    <div className="card-hd" style={{ background: bg + '08' }}>
      <div className="sec-icon" style={{ background: bg + '22' }}>{icon}</div>
      <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
      {count !== undefined && (
        <span style={{ marginLeft: 'auto', background: bg + '20', color: countColor || bg, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, border: `1px solid ${bg}30` }}>
          {count}
        </span>
      )}
    </div>
  );
}

function Field({ label, value, href }) {
  if (!value) return null;
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <span className="field-val">
        {href ? <a href={href} target="_blank" rel="noopener noreferrer">{value}</a> : value}
      </span>
    </div>
  );
}

function Pill({ label, cls }) {
  return <span className={`pill ${cls || 'pill-gray'}`}>{label}</span>;
}

// ─── HEADER ──────────────────────────────────────────────────
function Header({ mode, setMode }) {
  return (
    <header style={{ background: 'rgba(8,14,26,0.95)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 16px rgba(59,130,246,0.35)', flexShrink: 0 }}>📄</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px', lineHeight: 1.1 }}><span className="glow">ResumeAI</span></div>
          <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>NLP Information Extractor v3</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 11, padding: 3 }}>
        {[{ id: 'local', icon: '⚡', label: 'Local NLP' }, { id: 'api', icon: '🤖', label: 'AI Mode' }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`mode-btn ${mode === m.id ? 'mode-active' : 'mode-inactive'}`}>
            <span>{m.icon}</span><span>{m.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
}

// ─── INPUT PANEL ─────────────────────────────────────────────
function InputPanel({ onExtract, loading, mode }) {
  const [text, setText] = useState('');
  const [drag, setDrag] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const pdfRef = useRef();
  const txtRef = useRef();

  const handlePDF = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      return;
    }
    setPdfLoading(true);
    setFileName(file.name);
    try {
      const extracted = await extractTextFromPDF(file);
      setText(extracted);
    } catch (e) {
      alert('Could not read PDF: ' + e.message + '\n\nTip: Try copying text from PDF manually and pasting it.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleTXT = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => setText(e.target.result);
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.type === 'application/pdf') handlePDF(file);
    else handleTXT(file);
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* PDF Upload — primary */}
        <button className="btn btn-primary" onClick={() => pdfRef.current.click()} disabled={pdfLoading} style={{ fontSize: 12, padding: '8px 16px' }}>
          {pdfLoading ? <><span className="spinner" /> Reading PDF...</> : '📄 Upload PDF'}
        </button>
        <input ref={pdfRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handlePDF(e.target.files[0])} />

        {/* TXT Upload */}
        <button className="btn btn-ghost" onClick={() => txtRef.current.click()} style={{ fontSize: 12, padding: '8px 14px' }}>
          📁 Upload .txt
        </button>
        <input ref={txtRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={e => handleTXT(e.target.files[0])} />

        <button className="btn btn-ghost" onClick={() => { setText(SAMPLE); setFileName(''); }} style={{ fontSize: 12, padding: '8px 14px' }}>
          🧪 Sample
        </button>
        {text && <button className="btn btn-ghost" onClick={() => { setText(''); setFileName(''); }} style={{ fontSize: 12, padding: '8px 14px' }}>🗑 Clear</button>}

        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>
          {fileName && <span style={{ color: 'var(--green2)', marginRight: 8 }}>✓ {fileName}</span>}
          {words > 0 && `${words} words`}
        </span>
      </div>

      {/* PDF tip */}
      <div style={{ padding: '9px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>💡</span>
        <span><strong style={{ color: 'var(--green2)' }}>Tip:</strong> Click <strong>Upload PDF</strong> to directly read your resume PDF. Or paste text below. Or drag & drop a PDF/TXT file.</span>
      </div>

      {/* Mode banner */}
      <div style={{ padding: '9px 14px', borderRadius: 8, background: mode === 'api' ? 'rgba(139,92,246,0.07)' : 'rgba(59,130,246,0.07)', border: `1px solid ${mode === 'api' ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.2)'}`, fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 8 }}>
        <span>{mode === 'api' ? '🤖' : '⚡'}</span>
        <div><strong style={{ color: 'var(--text)' }}>{mode === 'api' ? 'AI Mode' : 'Local NLP'}:</strong> {mode === 'api' ? 'Uses Claude AI. Falls back to Local NLP if quota exceeded.' : 'Regex + Rule-based NER. Works offline. No API needed.'}</div>
      </div>

      {/* Textarea */}
      <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={handleDrop}>
        <div style={{ background: 'var(--bg3)', borderRadius: '12px 12px 0 0', border: '1px solid var(--border)', borderBottom: 'none', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.75 }} />)}
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>{fileName || 'resume.txt'}</span>
          {drag && <span style={{ fontSize: 11, color: 'var(--blue2)', marginLeft: 'auto' }}>Drop PDF or TXT here ↓</span>}
        </div>
        <textarea className="resume-input" value={text} onChange={e => setText(e.target.value)}
          style={{ borderColor: drag ? 'var(--blue)' : undefined }}
          placeholder={"Upload your PDF above, or paste resume text here...\n\nSupports any resume format:\n• PDF upload (reads text directly)\n• Plain text paste\n• .txt file upload\n• Drag & drop PDF or TXT\n\nExtracts: Name, Email, Phone, Skills, Education,\nExperience, Projects, Certifications, Languages..."}
        />
      </div>

      <button className="btn btn-primary" onClick={() => onExtract(text)} disabled={loading || !text.trim()} style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }}>
        {loading ? <><span className="spinner" /> Extracting...</> : '⚡ Extract Resume Information'}
      </button>
    </div>
  );
}

// ─── RESULT CARDS ─────────────────────────────────────────────

function PersonalCard({ data }) {
  if (!data?.name && !data?.title && !data?.summary) return null;
  return (
    <div className="card fade-up full">
      <CardHd icon="👤" bg="#3b82f6" title="Personal Information" />
      <div className="card-bd">
        {data.name && (
          <div style={{ marginBottom: data.summary ? 14 : 0 }}>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.6px', color: 'var(--text)', lineHeight: 1.2 }}>{data.name}</div>
            {data.title && <div style={{ fontSize: 14, color: 'var(--blue2)', fontWeight: 500, marginTop: 4, lineHeight: 1.4 }}>{data.title}</div>}
          </div>
        )}
        {data.summary && (
          <div style={{ padding: '12px 14px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 9, fontSize: 13, color: 'var(--text2)', lineHeight: 1.75 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue2)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>Summary</div>
            {data.summary}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactCard({ data, links }) {
  const hasContact = data && Object.values(data).some(v => v);
  const hasLinks = links && links.length > 0;
  if (!hasContact && !hasLinks) return null;

  const href = (key, val) => {
    if (!val) return '';
    if (key === 'email') return `mailto:${val}`;
    if (key === 'linkedin') return val.startsWith('http') ? val : `https://${val}`;
    if (key === 'github') return val.startsWith('http') ? val : `https://${val}`;
    if (key === 'website') return val.startsWith('http') ? val : `https://${val}`;
    return '';
  };

  return (
    <div className="card fade-up">
      <CardHd icon="📬" bg="#10b981" title="Contact & Links" />
      <div className="card-bd">
        <Field label="Email" value={data.email} href={href('email', data.email)} />
        <Field label="Phone" value={data.phone} />
        <Field label="Location" value={data.location} />
        <Field label="LinkedIn" value={data.linkedin} href={href('linkedin', data.linkedin)} />
        <Field label="GitHub" value={data.github} href={href('github', data.github)} />
        <Field label="Website" value={data.website} href={href('website', data.website)} />
        {hasLinks && links.filter(l => l.url || (!data.linkedin && l.label === 'LinkedIn') || (!data.github && l.label === 'GitHub')).length > 0 && (
          <>
            <div className="divider" />
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Profiles</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {links.map((l, i) => (
                <a key={i} href={l.url || '#'} target={l.url ? '_blank' : undefined} rel="noopener noreferrer"
                  style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(59,130,246,0.1)', color: 'var(--blue2)', border: '1px solid rgba(59,130,246,0.2)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {l.label === 'LinkedIn' ? '🔗' : l.label === 'GitHub' ? '🐙' : '🌐'} {l.label}
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SkillsCard({ data }) {
  const [filter, setFilter] = useState('all');
  if (!data) return null;
  const cats = [
    { key: 'technical',  label: 'Languages', cls: 'pill-blue' },
    { key: 'frameworks', label: 'Frameworks', cls: 'pill-purple' },
    { key: 'tools',      label: 'Tools',      cls: 'pill-gray' },
    { key: 'aiml',       label: 'AI/ML',      cls: 'pill-cyan' },
    { key: 'databases',  label: 'Databases',  cls: 'pill-green' },
    { key: 'devops',     label: 'DevOps',     cls: 'pill-amber' },
    { key: 'other',      label: 'Other',      cls: 'pill-rose' },
  ].filter(c => data[c.key]?.length > 0);
  const total = cats.reduce((s, c) => s + data[c.key].length, 0);
  if (total === 0) return null;
  const shown = filter === 'all' ? cats : cats.filter(c => c.key === filter);
  return (
    <div className="card fade-up full">
      <CardHd icon="💻" bg="#8b5cf6" title="Skills & Technologies" count={total} countColor="#c4b5fd" />
      <div className="card-bd">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          <button className={`chip ${filter === 'all' ? 'chip-active' : 'chip-inactive'}`} onClick={() => setFilter('all')}>All ({total})</button>
          {cats.map(c => <button key={c.key} className={`chip ${filter === c.key ? 'chip-active' : 'chip-inactive'}`} onClick={() => setFilter(c.key)}>{c.label} ({data[c.key].length})</button>)}
        </div>
        {shown.map(cat => (
          <div key={cat.key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>{cat.label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {data[cat.key].map((s, i) => <Pill key={i} label={s} cls={cat.cls} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExperienceCard({ data }) {
  const [exp, setExp] = useState({});
  if (!data?.length) return null;
  return (
    <div className="card fade-up full">
      <CardHd icon="🏢" bg="#f59e0b" title="Work Experience" count={`${data.length} role${data.length > 1 ? 's' : ''}`} countColor="#fcd34d" />
      <div className="card-bd">
        {data.map((e, i) => (
          <div key={i} style={{ marginBottom: i < data.length - 1 ? 18 : 0, paddingBottom: i < data.length - 1 ? 18 : 0, borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{e.role}</div>
                {e.company && <div style={{ fontSize: 13, color: 'var(--amber2)', fontWeight: 600, marginTop: 2 }}>{e.company}</div>}
                {e.location && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>📍 {e.location}</div>}
              </div>
              {e.duration && <Pill label={`📅 ${e.duration}`} cls="pill-amber" />}
            </div>
            {e.highlights?.length > 0 && (
              <>
                <ul style={{ paddingLeft: 18, margin: '8px 0', fontSize: 13, lineHeight: 1.75, color: 'var(--text2)' }}>
                  {(exp[i] ? e.highlights : e.highlights.slice(0, 3)).map((h, j) => <li key={j} style={{ marginBottom: 3 }}>{h}</li>)}
                </ul>
                {e.highlights.length > 3 && <button onClick={() => setExp(p => ({ ...p, [i]: !p[i] }))} style={{ background: 'none', border: 'none', color: 'var(--blue2)', fontSize: 12, cursor: 'pointer', padding: '2px 0', fontFamily: 'var(--sans)' }}>{exp[i] ? '▲ Less' : `▼ ${e.highlights.length - 3} more`}</button>}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EducationCard({ data }) {
  if (!data?.length) return null;
  return (
    <div className="card fade-up">
      <CardHd icon="🎓" bg="#10b981" title="Education" count={data.length} countColor="#34d399" />
      <div className="card-bd">
        {data.map((e, i) => (
          <div key={i} style={{ marginBottom: i < data.length - 1 ? 16 : 0, paddingBottom: i < data.length - 1 ? 16 : 0, borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35 }}>{e.degree}{e.field ? ` in ${e.field}` : ''}</div>
            {e.institution && <div style={{ fontSize: 13, color: 'var(--green2)', fontWeight: 600, marginTop: 3 }}>{e.institution}</div>}
            {e.board && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{e.board}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
              {e.startYear && e.year ? <Pill label={`📅 ${e.startYear} – ${e.year}`} cls="pill-green" /> : e.year ? <Pill label={`📅 ${e.year}`} cls="pill-green" /> : null}
              {e.gpa && <Pill label={`⭐ ${e.gpa}`} cls="pill-cyan" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CertificationsCard({ data }) {
  const certs = data?.filter(c => c.name) || [];
  if (!certs.length) return null;
  return (
    <div className="card fade-up">
      <CardHd icon="🏅" bg="#f43f5e" title="Certifications" count={certs.length} countColor="#fb7185" />
      <div className="card-bd">
        {certs.map((c, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: i < certs.length - 1 ? 13 : 0, paddingBottom: i < certs.length - 1 ? 13 : 0, borderBottom: i < certs.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
              {c.issuer && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.issuer}</div>}
            </div>
            <div style={{ flexShrink: 0, marginLeft: 10, textAlign: 'right' }}>
              {c.year && <Pill label={c.year} cls="pill-rose" />}
              {c.month && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{c.month}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LanguagesCard({ data }) {
  const langs = data?.filter(l => l.language) || [];
  if (!langs.length) return null;
  const col = (lv) => lv >= 85 ? '#10b981' : lv >= 70 ? '#3b82f6' : lv >= 50 ? '#8b5cf6' : lv >= 35 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="card fade-up">
      <CardHd icon="🌐" bg="#06b6d4" title="Languages" count={langs.length} countColor="#67e8f9" />
      <div className="card-bd">
        {langs.map((l, i) => {
          const lv = l.level || 50; const c = col(lv);
          return (
            <div key={i} style={{ marginBottom: i < langs.length - 1 ? 14 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{l.language}</span>
                <span style={{ fontSize: 11, color: c, fontWeight: 700, background: c + '18', padding: '2px 9px', borderRadius: 10, border: `1px solid ${c}30` }}>{l.proficiency || 'Known'}</span>
              </div>
              <div className="bar-wrap"><div className="bar-fill" style={{ width: `${lv}%`, background: `linear-gradient(90deg,${c},${c}99)` }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectsCard({ data }) {
  const projs = data?.filter(p => p.name) || [];
  if (!projs.length) return null;
  return (
    <div className="card fade-up full">
      <CardHd icon="🔬" bg="#06b6d4" title="Projects" count={projs.length} countColor="#67e8f9" />
      <div className="card-bd">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
          {projs.map((p, i) => (
            <div key={i} style={{ padding: 14, background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.12)', borderRadius: 10, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)'; e.currentTarget.style.background = 'rgba(6,182,212,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.12)'; e.currentTarget.style.background = 'rgba(6,182,212,0.04)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
                <div style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{p.name}</div>
                {p.link && p.link.startsWith('http') && <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--cyan)', marginLeft: 8, textDecoration: 'none' }}>↗</a>}
                {p.link && !p.link.startsWith('http') && p.link !== '' && <span style={{ fontSize: 10, color: 'var(--cyan)', marginLeft: 8, background: 'rgba(6,182,212,0.12)', padding: '2px 7px', borderRadius: 6 }}>🔗 Link</span>}
              </div>
              {p.description && <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 8 }}>{p.description}</div>}
              {p.tech?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{[...new Set(p.tech)].map((t, j) => <Pill key={j} label={t} cls="pill-cyan" />)}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AchievementsCard({ data }) {
  if (!data?.length) return null;
  return (
    <div className="card fade-up">
      <CardHd icon="🏆" bg="#f59e0b" title="Achievements" count={data.length} countColor="#fcd34d" />
      <div className="card-bd">
        {data.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: i < data.length - 1 ? 10 : 0, fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>
            <span style={{ color: 'var(--amber2)', flexShrink: 0 }}>★</span>{a}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreCard({ meta, skills, data }) {
  if (!meta) return null;
  const { completeness, wordCount } = meta;
  const col = completeness >= 80 ? '#10b981' : completeness >= 60 ? '#f59e0b' : '#f43f5e';
  const lbl = completeness >= 80 ? 'Excellent' : completeness >= 60 ? 'Good' : 'Needs Work';
  const totalSkills = skills ? Object.values(skills).flat().length : 0;
  return (
    <div className="card fade-up full">
      <CardHd icon="📊" bg="#8b5cf6" title="Resume Analytics" />
      <div className="card-bd">
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>Profile Completeness</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: col, fontWeight: 700, background: col + '18', padding: '2px 9px', borderRadius: 8, border: `1px solid ${col}30` }}>{lbl}</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: col }}>{completeness}%</span>
            </div>
          </div>
          <div className="bar-wrap" style={{ height: 7 }}><div className="bar-fill" style={{ width: `${completeness}%`, background: `linear-gradient(90deg,${col},${col}88)` }} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10 }}>
          {[
            { label: 'Skills', value: totalSkills },
            { label: 'Words', value: wordCount?.toLocaleString() },
            { label: 'Sections', value: meta.sectionsFound?.length || 0 },
            { label: 'Experience', value: data.experience?.length || 0 },
            { label: 'Projects', value: data.projects?.filter(p => p.name).length || 0 },
            { label: 'ATS Score', value: `${Math.min(99, completeness + 5)}%` },
          ].map(s => (
            <div key={s.label} className="stat">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value">{s.value}</span>
            </div>
          ))}
        </div>
        {meta.sectionsFound?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Sections Detected</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{meta.sectionsFound.map(s => <Pill key={s} label={s} cls="pill-purple" />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function JSONPanel({ data }) {
  const [copied, setCopied] = useState(false);
  const str = JSON.stringify(data, null, 2);
  const copy = () => { navigator.clipboard.writeText(str); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const download = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([str], { type: 'application/json' })); a.download = `resume_${Date.now()}.json`; a.click(); };
  return (
    <div className="card fade-up full">
      <div className="card-hd" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div className="sec-icon" style={{ background: 'rgba(100,116,139,0.2)' }}>{ }</div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Raw JSON Output</span>
          <Pill label="Structured NLP Data" cls="pill-gray" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copy} className={`btn ${copied ? 'btn-green' : 'btn-ghost'}`} style={{ fontSize: 12, padding: '6px 14px' }}>{copied ? '✓ Copied!' : '📋 Copy'}</button>
          <button onClick={download} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>⬇ Download</button>
        </div>
      </div>
      <pre style={{ background: '#060d1a', color: '#cdd6f4', padding: '16px 18px', fontSize: 11.5, lineHeight: 1.7, overflowX: 'auto', maxHeight: 400, overflowY: 'auto', margin: 0, fontFamily: 'var(--mono)' }}>{str}</pre>
    </div>
  );
}

// ─── RESULTS PANEL ───────────────────────────────────────────
function ResultsPanel({ data, usedMode }) {
  const [showJSON, setShowJSON] = useState(false);
  if (!data) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 14, color: 'var(--text3)', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 60, opacity: 0.25 }}>📋</div>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>No Data Yet</div>
        <div style={{ fontSize: 13 }}>Upload a PDF or paste your resume, then click Extract</div>
      </div>
    </div>
  );
  const totalSkills = Object.values(data.skills || {}).flat().length;
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Status */}
      <div style={{ padding: '10px 15px', borderRadius: 10, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        <span>✅</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green2)' }}>Extraction Complete</span>
        <Pill label={usedMode} cls="pill-green" />
        <div style={{ display: 'flex', gap: 12, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {[{ k: 'Skills', v: totalSkills }, { k: 'Jobs', v: data.experience?.length || 0 }, { k: 'Projects', v: data.projects?.filter(p => p.name).length || 0 }].map(s => (
            <span key={s.k} style={{ fontSize: 12, color: 'var(--text3)' }}><strong style={{ color: 'var(--green2)' }}>{s.v}</strong> {s.k}</span>
          ))}
        </div>
        <button onClick={() => setShowJSON(p => !p)} className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 12px' }}>{showJSON ? '🙈 Hide JSON' : '👁 View JSON'}</button>
      </div>
      <div className="grid-2">
        <ScoreCard meta={data.meta} skills={data.skills} data={data} />
        <PersonalCard data={data.personal} />
        <ContactCard data={data.contact} links={data.links} />
        <SkillsCard data={data.skills} />
        <ExperienceCard data={data.experience} />
        <EducationCard data={data.education} />
        <CertificationsCard data={data.certifications} />
        <LanguagesCard data={data.languages} />
        <AchievementsCard data={data.achievements} />
        <ProjectsCard data={data.projects} />
        {showJSON && <JSONPanel data={data} />}
      </div>
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState('local');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usedMode, setUsedMode] = useState('');
  const [view, setView] = useState('split');

  const handleExtract = useCallback(async (text) => {
    if (!text.trim()) { setError('Please upload a PDF or paste resume text.'); return; }
    setError(''); setLoading(true); setData(null);
    try {
      if (mode === 'api') {
        try {
          const r = await apiExtract(text); setUsedMode('AI (Claude API)'); setData(r);
        } catch (e) {
          setError(`API failed — using Local NLP instead.`);
          await new Promise(r => setTimeout(r, 400));
          setData(localNLPExtract(text)); setUsedMode('Local NLP (fallback)');
        }
      } else {
        await new Promise(r => setTimeout(r, 400));
        setData(localNLPExtract(text)); setUsedMode('Local NLP Engine');
      }
    } catch (e) { setError('Error: ' + e.message); }
    finally { setLoading(false); }
  }, [mode]);

  return (
    <>
      <Header mode={mode} setMode={setMode} />
      {/* Toolbar */}
      <div style={{ background: 'rgba(8,14,26,0.9)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 10, height: 46 }}>
        <div className="tab-bar">
          {[{ id: 'split', l: '⊡ Split' }, { id: 'input', l: '📝 Input' }, { id: 'result', l: '✨ Results' }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} className={`tab ${view === v.id ? 'tab-active' : 'tab-inactive'}`}>{v.l}</button>
          ))}
        </div>
        {data && <button className="btn btn-ghost" onClick={() => { setData(null); setError(''); }} style={{ fontSize: 12, padding: '5px 12px' }}>🔄 New</button>}
        {error && <div style={{ flex: 1, fontSize: 12, color: 'var(--amber2)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 7, padding: '4px 12px' }}>⚠️ {error}</div>}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text3)' }} className="hide-sm">NLP Course Project · Named Entity Recognition</span>
      </div>
      {/* Main */}
      <main style={{ flex: 1, padding: '20px 24px', overflow: 'auto' }}>
        {view === 'split' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, maxWidth: 1380, margin: '0 auto', alignItems: 'start' }} className="grid-2">
            <div style={{ position: 'sticky', top: 20 }}>
              <PLabel label="INPUT" sub="Upload PDF or paste text" color="var(--blue2)" />
              <InputPanel onExtract={handleExtract} loading={loading} mode={mode} />
            </div>
            <div>
              <PLabel label="EXTRACTED DATA" sub="Structured NLP output" color="#c4b5fd" />
              <ResultsPanel data={data} usedMode={usedMode} />
            </div>
          </div>
        ) : view === 'input' ? (
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <PLabel label="INPUT" sub="Upload PDF or paste text" color="var(--blue2)" />
            <InputPanel onExtract={handleExtract} loading={loading} mode={mode} />
          </div>
        ) : (
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <PLabel label="EXTRACTED DATA" sub="Structured NLP output" color="#c4b5fd" />
            <ResultsPanel data={data} usedMode={usedMode} />
          </div>
        )}
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '11px 24px', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', background: 'rgba(8,14,26,0.8)', flexWrap: 'wrap', gap: 6 }}>
        <span>ResumeAI v3.0 — NLP Information Extractor</span>
        <span>NER · Regex · Rule-based Parsing · PDF Support · Transformer NLP</span>
      </footer>
    </>
  );
}

function PLabel({ label, sub, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.09em', color, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>— {sub}</span>
    </div>
  );
}
