// Add this file to the ring application Apps Script project.
var RING_NOTIFICATION_URL = 'https://tmnyzkycdiokahujqblt.supabase.co/rest/v1/rpc/ring_notice_create';
var RING_NOTIFICATION_KEY = 'sb_publishable_KXmZQiIc_9K74hy4EI-mng_jUYgAr_D';
var RING_NOTIFICATION_PENDING_PREFIX = 'ring_notification_pending_';

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
