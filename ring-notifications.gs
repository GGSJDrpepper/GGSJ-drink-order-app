// Add this file to the ring application Apps Script project.
var RING_NOTIFICATION_URL = 'https://tmnyzkycdiokahujqblt.supabase.co/rest/v1/rpc/ring_notice_create';
var RING_NOTIFICATION_RESOLVE_URL = 'https://tmnyzkycdiokahujqblt.supabase.co/rest/v1/rpc/ring_notice_resolve';
var RING_NOTIFICATION_KEY = 'sb_publishable_KXmZQiIc_9K74hy4EI-mng_jUYgAr_D';
var RING_NOTIFICATION_PENDING_PREFIX = 'ring_notification_pending_';
var RING_NOTIFICATION_RESOLVED_PREFIX = 'ring_notification_resolved_';

function queueRingApplicationNotification_(applicationId, submittedAt) {
  var key = RING_NOTIFICATION_PENDING_PREFIX + applicationId;
  PropertiesService.getScriptProperties().setProperty(key, submittedAt.toISOString());
  try {
    sendRingApplicationNotification_(applicationId, submittedAt);
    PropertiesService.getScriptProperties().deleteProperty(key);
  } catch (error) {
    console.error('リング申請通知の送信を保留しました: ' + applicationId + ' ' + error);
  }
}

function sendRingApplicationNotification_(applicationId, submittedAt) {
  var producerKey = PropertiesService.getScriptProperties().getProperty('RING_NOTIFICATION_PRODUCER_KEY');
  if (!producerKey) throw new Error('RING_NOTIFICATION_PRODUCER_KEY が未設定です');
  var response = UrlFetchApp.fetch(RING_NOTIFICATION_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      apikey: RING_NOTIFICATION_KEY,
      Authorization: 'Bearer ' + RING_NOTIFICATION_KEY,
      Prefer: 'return=minimal'
    },
    payload: JSON.stringify({
      p_key: producerKey,
      p_id: applicationId,
      p_created_at: submittedAt.toISOString()
    }),
    muteHttpExceptions: true
  });
  var status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error('Supabase HTTP ' + status + ': ' + response.getContentText().slice(0, 300));
  }
}

function retryRingApplicationNotifications() {
  var props = PropertiesService.getScriptProperties();
  var pending = props.getProperties();
  Object.keys(pending).filter(function(key) {
    return key.indexOf(RING_NOTIFICATION_PENDING_PREFIX) === 0;
  }).forEach(function(key) {
    var applicationId = key.slice(RING_NOTIFICATION_PENDING_PREFIX.length);
    var submittedAt = new Date(pending[key]);
    if (isNaN(submittedAt.getTime())) {
      console.error('リング申請通知の日時が不正です: ' + applicationId);
      return;
    }
    try {
      sendRingApplicationNotification_(applicationId, submittedAt);
      props.deleteProperty(key);
    } catch (error) {
      console.error('リング申請通知の再送に失敗しました: ' + applicationId + ' ' + error);
    }
  });
}

function setupRingApplicationNotificationRetry() {
  var name = 'retryRingApplicationNotifications';
  if (ScriptApp.getProjectTriggers().some(function(trigger) {
    return trigger.getHandlerFunction() === name;
  })) return;
  ScriptApp.newTrigger(name).timeBased().everyMinutes(5).create();
}

function collectProcessedRingNotificationRows_(rows, timestamps, headers, now) {
  var idCol = headers.indexOf('申請ID');
  var gameIdCol = headers.indexOf('GameID番号 / GameID Number');
  var countedCol = headers.indexOf('カウントチップ額');
  var castCol = headers.indexOf('担当キャスト');
  var statusCol = headers.indexOf('処理状態');
  if ([idCol, gameIdCol, countedCol, castCol, statusCol].some(function(col) { return col < 0; })) {
    throw new Error('リング預かりシートの見出しが不足しています');
  }

  var cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000;
  var applications = rows.map(function(row, index) {
    var submittedAt = timestamps[index][0];
    var id = String(row[idCol] || '').trim();
    var gameId = String(row[gameIdCol] || '').replace(/\D/g, '');
    if (!(submittedAt instanceof Date) || isNaN(submittedAt.getTime()) ||
        submittedAt.getTime() < cutoff || submittedAt.getTime() > now.getTime() + 24 * 60 * 60 * 1000 ||
        !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id) || !/^\d{8}$/.test(gameId)) return null;
    return {
      id: id,
      gameId: gameId,
      submittedAt: submittedAt,
      processed: String(row[countedCol] == null ? '' : row[countedCol]).trim() !== '' &&
        String(row[castCol] || '').trim() !== '',
      mergedInto: String(row[statusCol] || '').trim().match(/^重複申請として統合：([0-9a-f-]{36})$/i)
    };
  }).filter(Boolean);

  var processedById = {};
  applications.forEach(function(item) {
    if (item.processed) processedById[item.id] = item.gameId;
  });
  return applications.filter(function(item) {
    return item.processed || (item.mergedInto && processedById[item.mergedInto[1]] === item.gameId);
  });
}

function syncResolvedRingApplicationNotifications() {
  var sheet = getApplicationSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var width = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, width).getDisplayValues()[0];
  var rows = sheet.getRange(2, 1, lastRow - 1, width).getDisplayValues();
  var timestamps = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var candidates = collectProcessedRingNotificationRows_(rows, timestamps, headers, new Date());
  var props = PropertiesService.getScriptProperties();
  var saved = props.getProperties();
  var cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  Object.keys(saved).filter(function(key) {
    return key.indexOf(RING_NOTIFICATION_RESOLVED_PREFIX) === 0 && Date.parse(saved[key]) < cutoff;
  }).forEach(function(key) { props.deleteProperty(key); });

  var sent = 0;
  candidates.forEach(function(item) {
    var key = RING_NOTIFICATION_RESOLVED_PREFIX + item.id;
    if (saved[key] || sent >= 50) return;
    try {
      sendRingApplicationResolution_(item.id, item.submittedAt);
      props.setProperty(key, item.submittedAt.toISOString());
      sent++;
    } catch (error) {
      console.error('リング申請通知の完了反映に失敗しました: ' + item.id + ' ' + error);
    }
  });
}

function sendRingApplicationResolution_(applicationId, submittedAt) {
  var producerKey = PropertiesService.getScriptProperties().getProperty('RING_NOTIFICATION_PRODUCER_KEY');
  if (!producerKey) throw new Error('RING_NOTIFICATION_PRODUCER_KEY が未設定です');
  var response = UrlFetchApp.fetch(RING_NOTIFICATION_RESOLVE_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      apikey: RING_NOTIFICATION_KEY,
      Authorization: 'Bearer ' + RING_NOTIFICATION_KEY,
      Prefer: 'return=minimal'
    },
    payload: JSON.stringify({
      p_key: producerKey,
      p_id: applicationId,
      p_created_at: submittedAt.toISOString()
    }),
    muteHttpExceptions: true
  });
  var status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error('Supabase HTTP ' + status + ': ' + response.getContentText().slice(0, 300));
  }
}

function setupRingApplicationResolutionSync() {
  var name = 'syncResolvedRingApplicationNotifications';
  if (ScriptApp.getProjectTriggers().some(function(trigger) {
    return trigger.getHandlerFunction() === name;
  })) return;
  ScriptApp.newTrigger(name).timeBased().everyMinutes(1).create();
}
