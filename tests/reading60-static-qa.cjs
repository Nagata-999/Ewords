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
const ids = new Set();
const types = new Map();
const answerPositions = new Map();
const longest = [];
const issues = [];
for (const [i, q] of questions.entries()) {
  const id = q.id || `index-${i}`;
  if (ids.has(id)) issues.push(`${id}: duplicate ID`);
  ids.add(id);
  for (const field of ['id','type','title','focus','question','explanation','translation','paraphrase']) {
    if (typeof q[field] !== 'string' || !q[field].trim()) issues.push(`${id}: missing ${field}`);
  }
  if (!Array.isArray(q.options) || q.options.length < 2 || q.options.some(v => typeof v !== 'string' || !v.trim())) {
    issues.push(`${id}: invalid options`);
    continue;
  }
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
    issues.push(`${id}: invalid answer`);
    continue;
  }
  types.set(q.type, (types.get(q.type) || 0) + 1);
  answerPositions.set(q.answer, (answerPositions.get(q.answer) || 0) + 1);
  if (q.options.length === 4 && q.options[q.answer].length > Math.max(...q.options.filter((_,j) => j !== q.answer).map(v => v.length))) longest.push(id);
}
const fourChoice = questions.filter(q => Array.isArray(q.options) && q.options.length === 4).length;
console.log(JSON.stringify({total:questions.length,uniqueIds:ids.size,types:Object.fromEntries(types),answerPositions:Object.fromEntries(answerPositions),fourChoice,strictlyLongestCorrect:longest.length,longestIds:longest,issues}, null, 2));
assert.deepEqual(issues, [], 'Static QA found blocking structural issues');
console.log('Reading60 static QA: PASS (length bias is advisory, not a failure)');
