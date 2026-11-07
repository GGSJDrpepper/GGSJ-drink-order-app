const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = { Date };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'ring-notifications.gs'), 'utf8'), context);

const headers = [
  'Timestamp', 'GameID番号 / GameID Number', 'カウントチップ額',
  '担当キャスト', '申請ID', '処理状態',
];
const completedId = '11111111-1111-4111-8111-111111111111';
const duplicateId = '22222222-2222-4222-8222-222222222222';
const laterId = '33333333-3333-4333-8333-333333333333';
const otherPlayerId = '44444444-4444-4444-8444-444444444444';
const now = new Date('2026-11-08T03:00:00Z');
const rows = [
  ['', '01234567', '0', '担当者', completedId, ''],
  ['', '01234567', '', '', duplicateId, `重複申請として統合：${completedId}`],
  ['', '01234567', '', '', laterId, ''],
  ['', '87654321', '', '', otherPlayerId, `重複申請として統合：${completedId}`],
];
const timestamps = rows.map((_, index) => [new Date(now.getTime() - (index + 1) * 60_000)]);
const result = context.collectProcessedRingNotificationRows_(rows, timestamps, headers, now);
assert.deepEqual(Array.from(result, (item) => item.id), [completedId, duplicateId]);

const stale = context.collectProcessedRingNotificationRows_(rows, [
  [new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)],
  ...timestamps.slice(1),
], headers, now);
assert.deepEqual(Array.from(stale, (item) => item.id), []);

console.log('ring notification resolution selection OK');
