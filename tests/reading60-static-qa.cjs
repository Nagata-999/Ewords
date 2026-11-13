'use strict';
/**
 * Static QA for reading60/index.html. Run: node tests/reading60-static-qa.cjs
 * Uses Node built-ins only. No network, PIN sync, or DB access.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'reading60', 'index.html'), 'utf8');
const start = html.indexOf('const questions=[');
assert(start >= 0, 'Question bank declaration not found');
const arrayStart = html.indexOf('[', start);
const arrayEnd = html.indexOf('];', arrayStart);
assert(arrayEnd > arrayStart, 'Question bank closing delimiter not found');
const questions = vm.runInNewContext(html.slice(arrayStart, arrayEnd + 1), Object.create(null), {timeout: 1000});
assert(Array.isArray(questions) && questions.length > 0, 'Question bank empty');
const allowedTypes = new Set(['TRUE / FALSE / NOT GIVEN','Summary Completion','Multiple Choice','Sentence Completion','Matching Information']);
const ids = new Set();
const types = new Map();
const answerPositions = new Map();
const longest = [];
const longestRatios = [];
const suspiciousAnswerLength = [];
const fourChoicePositions = [0,0,0,0];
const fourChoiceTypes = new Map();
const issues = [];
const passageReuse = new Map();
const shortPassages = [];
const emptyQuestionStems = [];
const stems = new Map();
const evidence = new Map();
const normalize = s => s.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
for (const [i, q] of questions.entries()) {
  const id = q.id || `index-${i}`;
  if (ids.has(id)) issues.push(`${id}: duplicate ID`);
  ids.add(id);
  if (!allowedTypes.has(q.type)) issues.push(`${id}: unknown question type`);
  for (const field of ['before','after']) {
    if (typeof q[field] !== 'string') issues.push(`${id}: invalid ${field}`);
  }
  if (typeof q.focus === 'string' && q.focus.trim().length < 30) issues.push(`${id}: evidence focus too short to review reliably`);
  const passage = [q.before, q.focus, q.after].filter(v => typeof v === 'string').join(' ');
  const passageKey = normalize(passage);
  if (passageKey) passageReuse.set(passageKey, (passageReuse.get(passageKey) || 0) + 1);
  // The displayed passage is built from before + focus + after, so checking
  // whether focus occurs in that concatenation is tautological. Instead flag
  // unusually short passages for editorial review.
  if (passage.trim().split(/\s+/).length < 25) shortPassages.push(id);
  const stem = normalize(q.question || '');
  if (!stem) { emptyQuestionStems.push(id); issues.push(`${id}: empty question stem`); }
  if (stems.has(stem)) issues.push(`${id}: duplicate question stem (${stems.get(stem)})`);
  else stems.set(stem, id);
  const evidenceKey = normalize(q.focus || '');
  if (evidenceKey && evidence.has(evidenceKey) && normalize(q.question || '') === normalize(evidence.get(evidenceKey).question)) issues.push(`${id}: repeated evidence and question`);
  else evidence.set(evidenceKey, q);
  for (const field of ['id','type','title','focus','question','explanation','translation','paraphrase']) {
    if (typeof q[field] !== 'string' || !q[field].trim()) issues.push(`${id}: missing ${field}`);
  }
  if (!Array.isArray(q.options) || q.options.length < 2 || q.options.some(v => typeof v !== 'string' || !v.trim())) {
    issues.push(`${id}: invalid options`);
    continue;
  }
  if (new Set(q.options.map(normalize)).size !== q.options.length) issues.push(`${id}: duplicate options`);
  if (q.type === 'TRUE / FALSE / NOT GIVEN' && (q.options.length !== 3 || !['TRUE','FALSE','NOT GIVEN'].every(v => q.options.includes(v)))) issues.push(`${id}: invalid TFNG labels`);
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
    issues.push(`${id}: invalid answer`);
    continue;
  }
  types.set(q.type, (types.get(q.type) || 0) + 1);
  answerPositions.set(q.answer, (answerPositions.get(q.answer) || 0) + 1);
  if (q.options.length === 4) {
    fourChoicePositions[q.answer]++;
    const counts = fourChoiceTypes.get(q.type) || [0,0,0,0];
    counts[q.answer]++;
    fourChoiceTypes.set(q.type, counts);
    const others = q.options.filter((_,j) => j !== q.answer).map(v => v.trim().length);
    const correctLength = q.options[q.answer].trim().length;
    const maxOtherLength = Math.max(...others);
    if (correctLength >= maxOtherLength * 1.5 && correctLength - maxOtherLength >= 8) suspiciousAnswerLength.push({id, correctLength, maxOtherLength});
    if (correctLength > maxOtherLength) {
      longest.push(id);
      longestRatios.push({id, ratio: Number((correctLength / Math.max(1, Math.max(...others))).toFixed(2))});
    }
  }
}
const tfngAnswers = {TRUE:0,FALSE:0,'NOT GIVEN':0};
for (const q of questions) {
  if (q.type === 'TRUE / FALSE / NOT GIVEN' && Array.isArray(q.options) && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length) {
    const label = q.options[q.answer];
    if (Object.hasOwn(tfngAnswers, label)) tfngAnswers[label]++;
  }
}
const fourChoice = questions.filter(q => Array.isArray(q.options) && q.options.length === 4).length;
console.log(JSON.stringify({total:questions.length,uniqueIds:ids.size,types:Object.fromEntries(types),answerPositions:Object.fromEntries(answerPositions),fourChoice,fourChoicePositions,fourChoicePositionsByType:Object.fromEntries(fourChoiceTypes),tfngAnswers,strictlyLongestCorrect:longest.length,longestIds:longest,longestRatios,suspiciousAnswerLength,passageReuseCounts:[...passageReuse.values()].filter(n=>n>1).sort((a,b)=>b-a),shortPassages,emptyQuestionStems,issues}, null, 2));
assert.deepEqual(issues, [], 'Static QA found blocking structural issues');
console.log('Reading60 static QA: PASS (length bias is advisory, not a failure)');
