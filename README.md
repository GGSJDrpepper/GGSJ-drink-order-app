# Drink Relay

ポーカー店舗向けのドリンクオーダー共有アプリです。受付、テーブル、バー受信を同じWebアプリ内で切り替えて使えます。

## できること

- 受付からドリンク、数量、届け先、テーブル、席番号、支払い状況、支払い方法、メモを送信
- テーブルからドリンク、ゲーム種別、テーブル、席番号、支払い方法を送信
- 受付・テーブルの商品は左カテゴリ、右の商品リストで選択
- 設定からカテゴリと商品を追加、編集、削除
- バー側で新規オーダーを受信し、通知音を鳴らす
- バー側で「作成開始」「作成済み」「会計済み」「提供済み」「取消」を更新
- 未提供オーダーの経過時間、最長待ち時間、未徴収件数を表示
- Supabase設定ありなら複数端末でリアルタイム共有、未設定なら同じブラウザ内のデモ同期

## 使い方

`index.html` をブラウザで開きます。

お客さん自身が注文する共通ページは `customer.html` です。QRコードはこのURLを1種類だけ用意します。お客さんは先に商品を選び、注文確認画面でテーブルA〜H、シート番号1〜10、支払い方法を選択して送信します。注文は未徴収としてバー受信へ送られます。

バー受信側の通知音は初期状態でオンです。音を止めたい場合は右上の歯車から設定を開き、「通知音」をオフにしてください。

メニューを変えたい場合は、右上の歯車から設定を開き、カテゴリ名と商品を編集して保存してください。カテゴリ追加や削除も設定からできます。

iPadやChrome/Safariはユーザー操作前の自動音声再生を制限するため、バー用iPadでは開店時に一度画面をタップしておくと通知音が確実に鳴ります。

## GitHubで店舗内共有できるか

GitHub Pagesにこのアプリを置くことはできます。ただしGitHub Pagesだけでは、受付iPadとバーiPadの間で注文データをリアルタイム共有できません。GitHub Pagesは画面を配信する場所で、注文データを保存・配信するリアルタイムDBが別途必要です。

おすすめ構成は次のどちらかです。

- GitHub Pages + Supabase: 店舗のiPad同士で同じURLを開けば共有できます。初期構築が軽く、リアルタイム受信もできます。
- 店舗内PC/Raspberry Pi + ローカルWebSocketサーバー: インターネットが不安定でも店舗LAN内で動かせますが、設置と保守が必要です。

この試作品は Supabase 用の設定欄を持っています。

## Supabase設定

1. Supabaseで新しいProjectを作成します。
2. SQL Editorで `supabase-schema.sql` の内容を実行します。
3. Project Settings の API から `Project URL` と `anon public key` をコピーします。
4. アプリ右上の歯車からURLとanon keyを保存します。
5. 受付iPad、バーiPad、テーブル用端末で同じURLを開きます。

注文データは、未提供オーダーと直近1時間の完了履歴だけを端末へ読み込みます。Supabase上では `pg_cron` により、注文時刻から24時間を超えたデータが1時間ごとに削除されます。既存プロジェクトへ更新を反映するときも、SQL Editorで最新の `supabase-schema.sql` を実行してください。

リング預かり申請通知を有効にするには、Supabase SQL Editorで `ring-notification-migration.sql` を実行します。通知テーブルは直接公開せず、申請送信用の32文字のランダムなコードを作成し、`private.ring_notification_keys` にSHA-256ハッシュだけを登録します。申請送信用コードはApps Scriptのスクリプトプロパティ `RING_NOTIFICATION_PRODUCER_KEY` に保存します。コードはソースファイルやGitHubに含めないでください。バー側の一覧表示と確認済み操作は公開RPCから行うため、URLを知っている人は誰でも操作できます。既存DBには `ring-notification-public-migration.sql` を適用します。

リング預かり申請のApps Scriptには、保存成功後に `queueRingApplicationNotification_(applicationId, submittedAt)` を呼ぶ処理と、`ring-notifications.gs` と同じ通知・再送処理が必要です。`setupRingApplicationNotificationRetry` を一度実行して5分ごとの再送トリガーを設定し、Webアプリを新しいバージョンに更新してください。通知には申請IDと申請時刻だけを保存し、Game ID番号・名前・申請額は送信しません。バー画面は5秒ごとに通知を確認します。

処理済み申請の通知を自動で消すには、既存DBへ `ring-notification-resolution-migration.sql` を実行し、Apps Scriptの通知コードを最新の `ring-notifications.gs` に更新します。`setupRingApplicationResolutionSync` を一度実行すると1分ごとに「リング預かり」シートを確認します。Game ID番号と申請IDで同じ営業日の処理済み行・重複統合行を照合し、通知IDだけをSupabaseへ送ります。後から同じGame IDで新たに出された未処理の申請は消しません。

`supabase-schema.sql` は試作品用に読み書きを広く許可しています。本番運用ではスタッフPIN、店舗ID、端末権限、削除制限を追加するのが安全です。
