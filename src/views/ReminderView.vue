<template>
  <div class="reminder-view-container">
    <h3>リマインダー管理</h3>

    <div class="create-reminder-section">
      <h4>新しいリマインダーを作成</h4>
      <input v-model="newReminder.customTitle" placeholder="タイトル" class="reminder-input" />
      <textarea v-model="newReminder.description" placeholder="説明 (任意)" class="reminder-textarea"></textarea>
      
      <label for="remindDate">通知日:</label>
      <input type="date" id="remindDate" v-model="newReminder.remindDate" class="reminder-input" />
      
      <label for="remindTime">通知時間:</label>
      <input type="time" id="remindTime" v-model="newReminder.remindTime" class="reminder-input" />
      
      <button @click="createReminder" class="action-button create-button">リマインダー作成</button>
      <p v-if="createError" class="error-message">{{ createError }}</p>
    </div>

    <hr class="section-divider" />

    <div class="reminder-list-section">
      <h4>あなたのリマインダー</h4>
      <p v-if="loadingReminders" class="loading-message">リマインダーを読み込み中...</p>
      <p v-if="fetchError" class="error-message">{{ fetchError }}</p>
      <p v-if="!hasToken" class="warning-message">
        ログインするとリマインダーを作成・表示できます。
      </p>

      <ul v-if="filteredReminders.length > 0">
        <li v-for="reminder in filteredReminders" :key="reminder.id" class="reminder-item">
          <div class="reminder-details">
            <strong>{{ reminder.customTitle }}</strong>
            <p v-if="reminder.description">{{ reminder.description }}</p>
            <p class="reminder-time">{{ formatDateTime(reminder.remindDate, reminder.remindTime) }}</p>
            <p class="reminder-status">ステータス: {{ reminder.status }}</p>
          </div>
          <button @click="deleteReminder(reminder.id)" class="action-button delete-button">削除</button>
        </li>
      </ul>
      <p v-else-if="!loadingReminders && hasToken">リマインダーはありません。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';

// --- APIエンドポイントの設定 ---
// バックエンドのリマインダーAPIエンドポイントを正確に指定してください
const REMINDER_API_URL = 'https://my-image-14467698004.asia-northeast1.run.app/api/reminders'; 

// --- 状態変数 ---
const reminders = ref([]);
const newReminder = ref({
  customTitle: '', // DTOに合わせる
  description: '',
  remindDate: '',  // DTOに合わせる
  remindTime: '',  // DTOに合わせる
  status: 'PENDING' // デフォルトステータス
});
const loadingReminders = ref(false);
const fetchError = ref(null);
const createError = ref(null);
const hasToken = ref(false); // ログイン状態を保持

// --- ライフサイクルフック ---
onMounted(() => {
  // コンポーネントがマウントされた時にトークンを確認し、リマインダーをフェッチ
  checkAuthToken();
  if (hasToken.value) {
    fetchReminders();
  }
});

// --- 認証トークン確認 ---
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (token) {
    hasToken.value = true;
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  } else {
    hasToken.value = false;
    return { 'Content-Type': 'application/json' };
  }
};

const checkAuthToken = () => {
    const token = localStorage.getItem('token');
    hasToken.value = !!token; // トークンがあればtrue
    if (!hasToken.value) {
        ElMessage.warning('ログインするとリマインダーを作成・表示できます。');
    }
};

// --- リマインダー取得 ---
const fetchReminders = async () => {
  if (!hasToken.value) {
    // トークンがない場合はフェッチしない
    ElMessage.info('ログインしていません。リマインダーを読み込みません。');
    reminders.value = [];
    return;
  }

  loadingReminders.value = true;
  fetchError.value = null;
  try {
    const headers = getAuthHeaders();
    const response = await fetch(REMINDER_API_URL, { headers });

    if (response.status === 401 || response.status === 403) {
      ElMessage.error('認証情報が無効です。再度ログインしてください。');
      localStorage.removeItem('token'); // 無効なトークンを削除
      hasToken.value = false;
      reminders.value = []; // リマインダーをクリア
      return;
    }
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'リマインダーの取得に失敗しました。');
    }
    const data = await response.json();
    reminders.value = data; // バックエンドからユーザーに紐づくリマインダーが返される想定
  } catch (err) {
    console.error('リマインダー取得エラー:', err);
    fetchError.value = err.message || 'リマインダーの読み込み中にエラーが発生しました。';
    ElMessage.error(fetchError.value);
  } finally {
    loadingReminders.value = false;
  }
};

// --- リマインダー作成 ---
const createReminder = async () => {
  if (!hasToken.value) {
    ElMessage.warning('リマインダーを作成するにはログインが必要です。');
    return;
  }
  // DTOの必須フィールドに合わせてバリデーション
  if (!newReminder.value.customTitle || !newReminder.value.remindDate || !newReminder.value.remindTime) {
    createError.value = 'タイトル、通知日、通知時間は必須です。';
    return;
  }

  createError.value = null;
  try {
    const headers = getAuthHeaders();
    const response = await fetch(REMINDER_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        customTitle: newReminder.value.customTitle,
        description: newReminder.value.description,
        remindDate: newReminder.value.remindDate, // YYYY-MM-DD 形式で送信
        remindTime: newReminder.value.remindTime, // HH:MM 形式で送信
        status: newReminder.value.status
      })
    });

    if (response.status === 401 || response.status === 403) {
      ElMessage.error('認証情報が無効です。再度ログインしてください。');
      localStorage.removeItem('token');
      hasToken.value = false;
      return;
    }
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'リマインダーの作成に失敗しました。');
    }

    ElMessage.success('リマインダーを作成しました！');
    // フォームをクリア
    newReminder.value = { customTitle: '', description: '', remindDate: '', remindTime: '', status: 'PENDING' };
    fetchReminders(); // リストを再読み込み
  } catch (err) {
    console.error('リマインダー作成エラー:', err);
    createError.value = err.message || 'リマインダーの作成中にエラーが発生しました。';
    ElMessage.error(createError.value);
  }
};

// --- リマインダー削除 ---
const deleteReminder = async (id) => {
  if (!hasToken.value) {
    ElMessage.warning('リマインダーを削除するにはログインが必要です。');
    return;
  }
  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${REMINDER_API_URL}/${id}`, {
      method: 'DELETE',
      headers: headers
    });

    if (response.status === 401 || response.status === 403) {
      ElMessage.error('認証情報が無効です。再度ログインしてください。');
      localStorage.removeItem('token');
      hasToken.value = false;
      return;
    }
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'リマインダーの削除に失敗しました。');
    }

    ElMessage.success('リマインダーを削除しました。');
    fetchReminders(); // リストを再読み込み
  } catch (err) {
    console.error('リマインダー削除エラー:', err);
    ElMessage.error(err.message || 'リマインダーの削除中にエラーが発生しました。');
  }
};

// --- リマインダーの表示（ログイン状態に応じてフィルタリング） ---
const filteredReminders = computed(() => {
  return hasToken.value ? reminders.value : [];
});

// --- 日付と時刻のフォーマット ---
const formatDateTime = (dateString, timeString) => {
  if (!dateString || !timeString) return '';
  
  try {
    // 例: dateString="2025-06-20", timeString="10:30"
    const date = new Date(`${dateString}T${timeString}`);
    if (isNaN(date)) return 'Invalid Date/Time';

    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error("Date/Time formatting error:", e);
    return 'Formatting Error';
  }
};
</script>

<style scoped>
.reminder-view-container {
  padding: 20px;
  background-color: #f0f2f5;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-height: 100%; /* モーダル内でスクロール可能にするため */
  overflow-y: auto; /* コンテンツがはみ出たらスクロール */
}

h3, h4 {
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.create-reminder-section, .reminder-list-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
}

.reminder-input, .reminder-textarea {
  width: calc(100% - 20px);
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
}

/* ラベルのスタイルを追加 */
label {
  display: block; /* ラベルを新しい行に配置 */
  text-align: left; /* 左寄せ */
  margin-bottom: 5px; /* 下の入力フィールドとのスペース */
  font-weight: bold;
  color: #555;
  font-size: 0.9em;
}


.reminder-textarea {
  resize: vertical;
  min-height: 80px;
}

.action-button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: background-color 0.3s ease;
  margin-top: 10px; /* ボタンと入力フィールドの間にスペース */
}

.create-button {
  background-color: #007bff;
  color: white;
}

.create-button:hover {
  background-color: #0056b3;
}

.delete-button {
  background-color: #dc3545;
  color: white;
  margin-left: 10px;
}

.delete-button:hover {
  background-color: #c82333;
}

.error-message {
  color: #dc3545;
  font-size: 0.9em;
  margin-top: 10px;
  text-align: center;
}

.loading-message {
  color: #007bff;
  text-align: center;
}

.warning-message {
  color: #ffc107;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
  margin-top: 15px;
}

.section-divider {
  border: 0;
  height: 1px;
  background-color: #eee;
  margin: 30px 0;
}

.reminder-list-section ul {
  list-style: none;
  padding: 0;
}

.reminder-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.reminder-details {
  flex-grow: 1;
  text-align: left;
}

.reminder-details strong {
  font-size: 1.1em;
  color: #343a40;
}

.reminder-details p {
  margin: 5px 0;
  color: #6c757d;
  font-size: 0.95em;
}

.reminder-time {
  font-size: 0.85em;
  color: #007bff;
  font-weight: bold;
}

.reminder-status {
    font-size: 0.85em;
    color: #4CAF50; /* Green color for status */
    font-weight: bold;
}
</style>