// DOM要素
const urlInput = document.getElementById('urlInput');
const textInput = document.getElementById('textInput');
const registerBtn = document.getElementById('registerBtn');
const registerForm = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');
const remindersList = document.getElementById('remindersList');

// UUID生成関数
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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

// 現在のタブのURL取得
async function getCurrentTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      urlInput.value = tab.url;
      validateForm();
    }
  } catch (error) {
    console.error('URLの取得に失敗しました:', error);
  }
}

// リマインダー登録
async function registerReminder(url, text) {
  try {
    const result = await chrome.storage.local.get(['reminders']);
    const reminders = result.reminders || [];

    const newReminder = {
      id: generateUUID(),
      url: url.trim(),
      text: text.trim(),
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

        content.appendChild(text);
        content.appendChild(date);

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

        item.appendChild(content);
        item.appendChild(deleteBtn);
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

  if (!url || !text) {
    showMessage('URLとリマインダー内容を入力してください', 'error');
    return;
  }

  const success = await registerReminder(url, text);

  if (success) {
    showMessage('リマインダーを登録しました', 'success');
    textInput.value = '';
    validateForm();
    displayReminders();
  } else {
    showMessage('登録に失敗しました', 'error');
  }
});

// 入力変更時のバリデーション
urlInput.addEventListener('input', validateForm);
textInput.addEventListener('input', validateForm);

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  getCurrentTabUrl();
  displayReminders();
  validateForm();
});
