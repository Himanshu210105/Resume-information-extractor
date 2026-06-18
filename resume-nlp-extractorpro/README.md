# ResumeAI v3.0 — NLP Extractor with PDF Support

## 🚀 Setup & Run

```bash
cd resume-nlp-extractor
npm install
npm start
```

Opens at http://localhost:3000

---

## 📄 PDF Support Setup (IMPORTANT)

After `npm install`, copy the PDF worker file:

```bash
# Mac/Linux:
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/

# Windows (Command Prompt):
copy node_modules\pdfjs-dist\build\pdf.worker.min.js public\

# Windows (PowerShell):
Copy-Item node_modules/pdfjs-dist/build/pdf.worker.min.js public/
```

Then run `npm start`.

---

## ✅ Fixes in v3.0
- **ALL CAPS names** now extracted (SHOURYA KAPOOR → Shourya Kapoor)
- **Skills no longer show in Certifications** — strict section isolation
- **Summary no longer swallows everything** — only dedicated summary section used
- **PDF upload** — read resume directly from PDF file
- **Better section detection** — exact header matching, not partial

## 📁 Files
```
src/
  App.js              ← All UI
  index.css           ← Dark theme
  utils/
    nlpEngine.js      ← NLP Engine (Regex + NER)
    pdfReader.js      ← PDF text extractor
    apiService.js     ← Claude AI API
public/
  pdf.worker.min.js   ← Copy here after npm install (see above)
```
