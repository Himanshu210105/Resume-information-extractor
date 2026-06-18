const SYS = `You are an expert NLP resume parser. Extract ALL information from the resume text and return ONLY valid JSON (no markdown, no explanation):
{"personal":{"name":"","title":"","summary":""},"contact":{"email":"","phone":"","location":"","linkedin":"","github":"","website":""},"links":[{"label":"","url":""}],"skills":{"technical":[],"frameworks":[],"tools":[],"aiml":[],"databases":[],"devops":[],"other":[]},"experience":[{"company":"","role":"","duration":"","location":"","highlights":[],"technologies":[]}],"education":[{"institution":"","degree":"","field":"","year":"","startYear":"","gpa":"","board":"","achievements":[]}],"certifications":[{"name":"","issuer":"","year":"","month":""}],"languages":[{"language":"","proficiency":"","level":0}],"projects":[{"name":"","description":"","tech":[],"link":""}],"achievements":[],"meta":{"completeness":0,"wordCount":0,"charCount":0,"sectionsFound":[]}}
Rules: language level: Native=100, Fluent=85, Professional=75, Intermediate=55, Basic=30. Return ONLY JSON.`;

export async function apiExtract(text) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYS,
      messages: [{ role: 'user', content: text }]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || JSON.stringify(data.error));
  const raw = data.content.map(b => b.text || '').join('');
  return JSON.parse(raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
}
