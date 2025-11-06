// リマインダーポップアップが既に表示されているかチェック
let reminderPopupShown = false;

// エスケープ関数（XSS対策）
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// URLからドメインを抽出（プロトコル＋ホスト名）
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}`;
  } catch (error) {
    console.error('URLの解析に失敗しました:', url, error);
    return null;
  }
}

// リマインダーポップアップを作成
function createReminderPopup(reminders) {
  // 既存のポップアップを削除
  const existingPopup = document.getElementById('webpage-reminder-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // オーバーレイの作成
  const overlay = document.createElement('div');
  overlay.id = 'webpage-reminder-popup';
  overlay.className = 'reminder-overlay';

  // ポップアップコンテナの作成
  const popup = document.createElement('div');
  popup.className = 'reminder-popup';

  // ヘッダー
  const header = document.createElement('div');
  header.className = 'reminder-header';

  const title = document.createElement('h3');
  title.className = 'reminder-title';
  title.textContent = 'リマインダー';

  const closeAllBtn = document.createElement('button');
  closeAllBtn.className = 'reminder-close-all';
  closeAllBtn.textContent = 'すべて閉じる';
  closeAllBtn.addEventListener('click', () => {
    overlay.remove();
    reminderPopupShown = false;
  });

  header.appendChild(title);
  header.appendChild(closeAllBtn);
  popup.appendChild(header);

  // リマインダーリスト
  const list = document.createElement('div');
  list.className = 'reminder-list';

  reminders.forEach(reminder => {
    const item = document.createElement('div');
    item.className = 'reminder-list-item';
    item.dataset.reminderId = reminder.id;

    const content = document.createElement('div');
    content.className = 'reminder-list-content';

    const text = document.createElement('div');
    text.className = 'reminder-list-text';
    text.textContent = reminder.text;

    const date = document.createElement('div');
    date.className = 'reminder-list-date';
    const createdDate = new Date(reminder.createdAt);
    date.textContent = `登録: ${createdDate.toLocaleString('ja-JP')}`;

    content.appendChild(text);
    content.appendChild(date);

    const completeBtn = document.createElement('button');
    completeBtn.className = 'reminder-complete-btn';
    completeBtn.textContent = '完了';
    completeBtn.addEventListener('click', async () => {
      await completeReminder(reminder.id, item);
    });

    item.appendChild(content);
    item.appendChild(completeBtn);
    list.appendChild(item);
  });

  popup.appendChild(list);
  overlay.appendChild(popup);

  // DOMに追加
  document.body.appendChild(overlay);
  reminderPopupShown = true;
}

// リマインダーを完了（削除）
async function completeReminder(id, itemElement) {
  try {
    // ストレージから削除
    const result = await chrome.storage.local.get(['reminders']);
    const reminders = result.reminders || [];
    const filteredReminders = reminders.filter(reminder => reminder.id !== id);
    await chrome.storage.local.set({ reminders: filteredReminders });

    // UIから削除
    itemElement.style.opacity = '0';
    setTimeout(() => {
      itemElement.remove();

      // すべてのリマインダーが完了した場合、ポップアップを閉じる
      const remainingItems = document.querySelectorAll('.reminder-list-item');
      if (remainingItems.length === 0) {
        const overlay = document.getElementById('webpage-reminder-popup');
        if (overlay) {
          overlay.remove();
          reminderPopupShown = false;
        }
      }
    }, 300);
  } catch (error) {
    console.error('リマインダーの完了処理に失敗しました:', error);
  }
}

// URLがリマインダーとマッチするか判定
function isUrlMatch(currentUrl, reminder) {
  const matchType = reminder.matchType || 'domain'; // デフォルトはドメイン一致

  switch (matchType) {
    case 'exact':
      // 完全一致
      return currentUrl === reminder.url;

    case 'prefix':
      // 前方一致
      return currentUrl.startsWith(reminder.url);

    case 'domain':
    default:
      // ドメイン一致
      const currentDomain = extractDomain(currentUrl);
      const reminderDomain = extractDomain(reminder.url);
      return currentDomain && reminderDomain && currentDomain === reminderDomain;
  }
}

// 現在のURLに一致するリマインダーを取得
async function getMatchingReminders(currentUrl) {
  try {
    const result = await chrome.storage.local.get(['reminders']);
    const reminders = result.reminders || [];

    // 各リマインダーのmatchTypeに応じてフィルタリング
    const matchingReminders = reminders.filter(reminder =>
      isUrlMatch(currentUrl, reminder)
    );

    return matchingReminders;
  } catch (error) {
    console.error('リマインダーの取得に失敗しました:', error);
    return [];
  }
}

// リマインダーをチェックして表示
async function checkAndShowReminders() {
  // 既に表示されている場合はスキップ
  if (reminderPopupShown) {
    return;
  }

  const currentUrl = window.location.href;
  const matchingReminders = await getMatchingReminders(currentUrl);

  if (matchingReminders.length > 0) {
    createReminderPopup(matchingReminders);
  }
}

// ページ読み込み完了時に実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndShowReminders);
} else {
  // 既にDOMが読み込まれている場合
  checkAndShowReminders();
}

// ストレージの変更を監視（他のタブでリマインダーが追加された場合）
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.reminders) {
    // ポップアップが表示されていない場合のみ再チェック
    if (!reminderPopupShown) {
      checkAndShowReminders();
    }
  }
});
