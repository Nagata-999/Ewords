#!/usr/bin/env node
// Validate the TOEIC Part 5 question bank without external dependencies.
import fs from 'node:fs';
const file = new URL('./index.html', import.meta.url);
const html = fs.readFileSync(file, 'utf8');
const start = html.indexOf('const BANK=');
const end = html.indexOf(';const RULES=', start);
if (start < 0 || end < 0) throw new Error('BANK section not found');
const bank = JSON.parse(html.slice(start + 'const BANK='.length, end));
const patternStart = html.indexOf('const PATTERNS=');
const patternEnd = html.indexOf(';const BANK=', patternStart);
if (patternStart < 0 || patternEnd < 0) throw new Error('PATTERNS section not found');
const patterns = JSON.parse(html.slice(patternStart + 'const PATTERNS='.length, patternEnd));
const errors = [], warnings = [], seen = new Map(), stems = new Map();
const norm = v => v.toLowerCase().normalize('NFKC').replace(/[^a-z0-9_ ]/g, '').replace(/\s+/g, ' ').trim();
bank.forEach((q, id) => {
 const n = id + 1;
 if (!Array.isArray(q) || q.length !== 6) { errors.push('Q'+n+': expected 6 fields'); return; }
 const [sentence, choices, answer, explanation, category, level] = q;
 if (typeof sentence !== 'string' || !sentence.includes('___')) errors.push('Q'+n+': missing blank');
 if (!Array.isArray(choices) || choices.length !== 4 || choices.some(x => typeof x !== 'string' || !x.trim())) errors.push('Q'+n+': invalid choices');
 if (!Number.isInteger(answer) || answer < 0 || answer > 3) errors.push('Q'+n+': invalid answer index');
 if (typeof explanation !== 'string' || !explanation.trim()) errors.push('Q'+n+': missing explanation');
 if (!Object.hasOwn(patterns, category)) errors.push('Q'+n+': unknown category '+category);
 if (![400,600,800,900].includes(level)) errors.push('Q'+n+': invalid level '+level);
 if (Array.isArray(choices) && choices.length === 4) {
   const opts = choices.map(norm);
   if (new Set(opts).size !== 4) errors.push('Q'+n+': duplicate answer choices');
   if (choices.some(x => /\s{2,}/.test(x))) warnings.push('Q'+n+': repeated whitespace in choice');
 }
 if (typeof sentence === 'string') {
   const key = norm(sentence);
   if (seen.has(key)) errors.push('Q'+n+': duplicate stem with Q'+seen.get(key));
   else seen.set(key, n);
   const skeleton = key.replace(/\b(?:the|a|an|new|company|manager|team|report|employee|staff|customer|project|office)\b/g,'').replace(/\s+/g,' ').trim();
   const previous = stems.get(skeleton);
   if (previous) warnings.push('Q'+n+': similar sentence structure to Q'+previous);
   else stems.set(skeleton, n);
 }
});
const rulesStart = html.indexOf('const RULES='), rulesEnd = html.indexOf(';const RULE_FOR=', rulesStart);
if (rulesStart < 0 || rulesEnd < 0) errors.push('RULES section not found');
else {
 const raw = html.slice(rulesStart + 'const RULES='.length, rulesEnd);
 const ruleIds = [...raw.matchAll(/ids:\[([^\]]*)\]/g)];
 for (const match of ruleIds) {
   for (const value of match[1].split(',').filter(Boolean)) {
     const id = Number(value.trim());
     if (!Number.isInteger(id) || id < 0 || id >= bank.length) errors.push('Invalid RULES question id: '+value);
   }
 }
}
console.log('TOEIC Part 5 QA | '+bank.length+' questions | '+errors.length+' errors | '+warnings.length+' warnings');
for (const msg of errors) console.error('ERROR '+msg);
for (const msg of warnings) console.warn('WARN '+msg);
console.log('NOTE: Automated checks cannot determine grammatical ambiguity or naturalness; editorial review is required.');
if (errors.length) process.exitCode = 1;
