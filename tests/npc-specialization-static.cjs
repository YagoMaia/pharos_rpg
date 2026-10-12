const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');

const modalSource = fs.readFileSync('components/modals/AddNpcModal.tsx', 'utf8');

test('AddNpcModal resets and validates NPC specialization state', () => {
  assert.match(modalSource, /setSpecializationId\(initialData\.specialization\?\.id \|\| ""\)/);
  assert.match(modalSource, /setSpecializationId\(""\)/);
  assert.match(modalSource, /currentSpec\?\.classRequired === cls \? current : ""/);
  assert.match(modalSource, /return spec\?\.classRequired === npcClass \? spec : null/);
});

test('AddNpcModal saves specialized stances into phase overrides', () => {
  assert.match(modalSource, /stances: data\.specialization\?\.newStances\?\.length \? data\.specialization\.newStances : data\.stances/);
  assert.doesNotMatch(modalSource, /console\.log\("NOVAS SKILLS/);
});
