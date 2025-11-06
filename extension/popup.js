// DOM要素
const urlInput = document.getElementById('urlInput');
const textInput = document.getElementById('textInput');
const registerBtn = document.getElementById('registerBtn');
const registerForm = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');
const remindersList = document.getElementById('remindersList');

// 編集関連のDOM要素
const editSection = document.getElementById('editSection');
const registerSection = document.querySelector('.register-section');
const listSection = document.querySelector('.list-section');
const editUrlInput = document.getElementById('editUrlInput');
const editTextInput = document.getElementById('editTextInput');
const editCreatedAt = document.getElementById('editCreatedAt');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editForm = document.getElementById('editForm');
const editMessageDiv = document.getElementById('editMessage');

// 編集中のリマインダーID
let currentEditingId = null;

// UUID生成関数
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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

// メッセージ表示関数
function showMessage(text, type = 'success') {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;

  setTimeout(() => {
    messageDiv.className = 'message';
  }, 3000);
}

// バリデーション関数
function validateForm() {
  const urlValue = urlInput.value.trim();
  const textValue = textInput.value.trim();

  registerBtn.disabled = !urlValue || !textValue;
}

// 現在のタブのドメイン取得
async function getCurrentTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const domain = extractDomain(tab.url);
      if (domain) {
        urlInput.value = domain;
      } else {
        urlInput.value = tab.url; // ドメイン抽出失敗時はフルURLを使用
      }
      validateForm();
    }
  } catch (error) {
    console.error('URLの取得に失敗しました:', error);
  }
}

// リマインダー登録
async function registerReminder(url, text, matchType) {
  try {
    const result = await chrome.storage.local.get(['reminders']);
    const reminders = result.reminders || [];

    const newReminder = {
      id: generateUUID(),
      url: url.trim(),
      text: text.trim(),
      matchType: matchType || 'domain', // デフォルトはドメイン一致
      createdAt: new Date().toISOString()
    };

    reminders.push(newReminder);

    await chrome.storage.local.set({ reminders });

    return true;
  } catch (error) {
    console.error('リマインダーの登録に失敗しました:', error);
    return false;
  }
}

// リマインダー削除
async function deleteReminder(id) {
  try {
    const result = await chrome.storage.local.get(['reminders']);
    const reminders = result.reminders || [];

    const filteredReminders = reminders.filter(reminder => reminder.id !== id);

    await chrome.storage.local.set({ reminders: filteredReminders });

    return true;
  } catch (error) {
    console.error('リマインダーの削除に失敗しました:', error);
    return false;
  }
}

// IDでリマインダーを取得
async function getReminderById(id) {
  try {
    const result = await chrome.storage.local.get(['reminders']);
    const reminders = result.reminders || [];
    return reminders.find(reminder => reminder.id === id);
  } catch (error) {
    console.error('リマインダーの取得に失敗しました:', error);
    return null;
  }
}

// リマインダーを更新
async function updateReminder(id, newUrl, newText) {
  try {
    const result = await chrome.storage.local.get(['reminders']);
    const reminders = result.reminders || [];

    const index = reminders.findIndex(r => r.id === id);

    if (index === -1) {
      throw new Error('リマインダーが見つかりません');
    }

    // URLとテキストのみ更新（id, createdAtは保持）
    reminders[index].url = newUrl.trim();
    reminders[index].text = newText.trim();

    await chrome.storage.local.set({ reminders });

    return true;
  } catch (error) {
    console.error('リマインダーの更新に失敗しました:', error);
    throw error;
  }
}

// 編集フォームを表示
async function showEditForm(reminderId) {
  const reminder = await getReminderById(reminderId);

  if (!reminder) {
    showMessage('リマインダーが見つかりません', 'error');
    return;
  }

  // フォームに値を設定
  editUrlInput.value = reminder.url;
  editTextInput.value = reminder.text;
  const createdDate = new Date(reminder.createdAt);
  editCreatedAt.textContent = createdDate.toLocaleString('ja-JP');

  // 編集中のIDを保持
  currentEditingId = reminderId;

  // UI切り替え
  editSection.style.display = 'block';
  registerSection.style.display = 'none';
  listSection.style.display = 'none';

  // バリデーション実行
  validateEditForm();
}

// 編集をキャンセル
function cancelEdit() {
  // 編集中IDをクリア
  currentEditingId = null;

  // UI切り替え
  editSection.style.display = 'none';
  registerSection.style.display = 'block';
  listSection.style.display = 'block';

  // フォームをリセット
  editForm.reset();
  editMessageDiv.className = 'message';
}

// 編集フォームのバリデーション
function validateEditForm() {
  const urlValue = editUrlInput.value.trim();
  const textValue = editTextInput.value.trim();

  saveEditBtn.disabled = !urlValue || !textValue;
}

// 編集メッセージ表示関数
function showEditMessage(text, type = 'success') {
  editMessageDiv.textContent = text;
  editMessageDiv.className = `message ${type}`;

  setTimeout(() => {
    editMessageDiv.className = 'message';
  }, 3000);
}

// リマインダー一覧表示
async function displayReminders() {
  try {
    const result = await chrome.storage.local.get(['reminders']);
    const reminders = result.reminders || [];

    remindersList.innerHTML = '';

    if (reminders.length === 0) {
      remindersList.innerHTML = '<div class="empty-message">登録されているリマインダーはありません</div>';
      return;
    }

    // URL別にグループ化
    const groupedByUrl = {};
    reminders.forEach(reminder => {
      if (!groupedByUrl[reminder.url]) {
        groupedByUrl[reminder.url] = [];
      }
      groupedByUrl[reminder.url].push(reminder);
    });

    // URL別に表示
    Object.entries(groupedByUrl).forEach(([url, urlReminders]) => {
      const urlGroup = document.createElement('div');
      urlGroup.className = 'url-group';

      const urlHeader = document.createElement('div');
      urlHeader.className = 'url-header';
      urlHeader.textContent = url;
      urlGroup.appendChild(urlHeader);

      // 新しい順にソート
      urlReminders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      urlReminders.forEach(reminder => {
        const item = document.createElement('div');
        item.className = 'reminder-item';

        const content = document.createElement('div');
        content.className = 'reminder-content';

        const text = document.createElement('div');
        text.className = 'reminder-text';
        text.textContent = reminder.text;

        const date = document.createElement('div');
        date.className = 'reminder-date';
        const createdDate = new Date(reminder.createdAt);
        date.textContent = `登録日時: ${createdDate.toLocaleString('ja-JP')}`;

        // マッチング方式を表示
        const matchType = document.createElement('span');
        matchType.className = `reminder-match-type ${reminder.matchType || 'domain'}`;
        const matchTypeLabels = {
          'domain': 'ドメイン一致',
          'prefix': '前方一致',
          'exact': '完全一致'
        };
        matchType.textContent = matchTypeLabels[reminder.matchType || 'domain'];

        content.appendChild(text);
        content.appendChild(date);
        content.appendChild(matchType);

        // ボタングループ
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'reminder-buttons';

        // 編集ボタン
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = '編集';
        editBtn.addEventListener('click', () => {
          showEditForm(reminder.id);
        });

        // 削除ボタン
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '削除';
        deleteBtn.addEventListener('click', async () => {
          const success = await deleteReminder(reminder.id);
          if (success) {
            showMessage('リマインダーを削除しました', 'success');
            displayReminders();
          } else {
            showMessage('削除に失敗しました', 'error');
          }
        });

        buttonsDiv.appendChild(editBtn);
        buttonsDiv.appendChild(deleteBtn);

        item.appendChild(content);
        item.appendChild(buttonsDiv);
        urlGroup.appendChild(item);
      });

      remindersList.appendChild(urlGroup);
    });
  } catch (error) {
    console.error('リマインダーの表示に失敗しました:', error);
    remindersList.innerHTML = '<div class="empty-message">エラーが発生しました</div>';
  }
}

// フォーム送信ハンドラ
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const url = urlInput.value.trim();
  const text = textInput.value.trim();
  const matchType = document.querySelector('input[name="matchType"]:checked').value;

  if (!url || !text) {
    showMessage('URLとリマインダー内容を入力してください', 'error');
    return;
  }

  const success = await registerReminder(url, text, matchType);

  if (success) {
    showMessage('リマインダーを登録しました', 'success');
    textInput.value = '';
    validateForm();
    displayReminders();
  } else {
    showMessage('登録に失敗しました', 'error');
  }
});

// 既存リマインダーのマイグレーション（matchTypeフィールドがない場合に追加）
async function migrateReminders() {
  try {
    const result = await chrome.storage.local.get(['reminders']);
    const reminders = result.reminders || [];

    let needsUpdate = false;
    const migratedReminders = reminders.map(reminder => {
      if (!reminder.matchType) {
        needsUpdate = true;
        return { ...reminder, matchType: 'domain' }; // デフォルトはドメイン一致
      }
      return reminder;
    });

    if (needsUpdate) {
      await chrome.storage.local.set({ reminders: migratedReminders });
      console.log('リマインダーのマイグレーションが完了しました');
    }
  } catch (error) {
    console.error('マイグレーションに失敗しました:', error);
  }
}

// 入力変更時のバリデーション
urlInput.addEventListener('input', validateForm);
textInput.addEventListener('input', validateForm);

// 編集フォーム送信ハンドラ
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const url = editUrlInput.value.trim();
  const text = editTextInput.value.trim();

  if (!url || !text) {
    showEditMessage('URLとリマインダー内容を入力してください', 'error');
    return;
  }

  if (!currentEditingId) {
    showEditMessage('編集対象のリマインダーが見つかりません', 'error');
    return;
  }

  try {
    await updateReminder(currentEditingId, url, text);
    showEditMessage('リマインダーを更新しました', 'success');

    // 少し待ってから一覧に戻る
    setTimeout(() => {
      cancelEdit();
      displayReminders();
    }, 1000);
  } catch (error) {
    if (error.message === 'リマインダーが見つかりません') {
      showEditMessage('このリマインダーは既に削除されています', 'error');
      setTimeout(() => {
        cancelEdit();
        displayReminders();
      }, 2000);
    } else {
      showEditMessage('更新に失敗しました', 'error');
    }
  }
});

// 編集キャンセルボタン
cancelEditBtn.addEventListener('click', cancelEdit);

// 編集フォームの入力変更時のバリデーション
editUrlInput.addEventListener('input', validateEditForm);
editTextInput.addEventListener('input', validateEditForm);

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  await migrateReminders(); // マイグレーション実行
  getCurrentTabUrl();
  displayReminders();
  validateForm();
});
