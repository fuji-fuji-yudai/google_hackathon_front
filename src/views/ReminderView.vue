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
      
      <p v-if="!props.jwtToken" class="warning-message">
        ログインするとリマインダーを作成・表示できます。
        <br>
        <a :href="googleLoginUrl" class="google-login-button action-button">Googleでログイン</a>
      </p>

      <ul v-if="filteredReminders.length > 0">
        <li v-for="reminder in filteredReminders" :key="reminder.id" class="reminder-item">
          <div class="reminder-details">
            <strong>{{ reminder.customTitle }}</strong>
            <p v-if="reminder.description">{{ reminder.description }}</p>
            <p class="reminder-time">{{ formatDateTime(reminder.remindDate, reminder.remindTime) }}</p>
            <p v-if="reminder.nextRemindTime" class="reminder-time">次回: {{ formatNextRemindTime(reminder.nextRemindTime) }}</p>
            <p v-if="reminder.recurrenceType && reminder.recurrenceType !== 'NONE'" class="reminder-status">繰り返し: {{ reminder.recurrenceType }}</p>
          </div>
          <button @click="deleteReminder(reminder.id)" class="action-button delete-button">削除</button>
        </li>
      </ul>
      <p v-else-if="!loadingReminders && props.jwtToken">リマインダーはありません。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, defineProps, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// APIエンドポイントの設定
const REMINDER_API_URL = 'https://my-image-14467698004.asia-northeast1.run.app/api/reminders';
// GoogleログインのURLを直接指定 (バックエンドのOAuth2認証エンドポイント)
// ★修正: バックエンドのSecurityConfig.javaで定義されたカスタムURIに合わせる
const googleLoginUrl = 'https://my-image-14467698004.asia-northeast1.run.app/oauth2/authorization/google-calendar';


// プロップスの定義
const props = defineProps({
  jwtToken: {
    type: String,
    default: null,
  },
});

// 状態変数
const reminders = ref([]);
const newReminder = ref({
  customTitle: '',
  description: '',
  remindDate: '',
  remindTime: '',
  // ★修正: statusフィールドはバックエンドのReminderRequestにないため削除
  // recurrenceType, nextRemindTime, attendeeEmails を追加（UIにはないが送信するため）
  recurrenceType: 'NONE', // デフォルト値
  nextRemindTime: '',     // デフォルト値
  attendeeEmails: []      // デフォルト値
});

// Googleアクセストークンを保持するrefは不要になったため削除
// const googleAccessToken = ref(null); 

const loadingReminders = ref(false);
const fetchError = ref(null);
const createError = ref(null);

// ライフサイクルフック
onMounted(() => {
  if (props.jwtToken) {
    fetchReminders();
  } else {
    ElMessage.warning('ログインするとリマインダーを作成・表示できます。');
  }
  // GoogleアクセストークンをlocalStorageから読み込むロジックは不要になったため削除
  // const storedGoogleToken = localStorage.getItem('google_access_token');
  // if (storedGoogleToken) {
  //   googleAccessToken.value = storedGoogleToken;
  //   console.log('Google Access Token loaded from localStorage.');
  // }
});

// JWTトークンの変更を監視
watch(() => props.jwtToken, (newToken, oldToken) => {
  if (newToken && newToken !== oldToken) {
    console.log('JWT Token changed, re-fetching reminders.');
    fetchReminders();
  } else if (!newToken && oldToken) {
    console.log('JWT Token removed, clearing reminders.');
    reminders.value = [];
    nextTick(() => {
      ElMessage.warning('ログアウトしました。リマインダーを操作するには再度ログインが必要です。');
    });
  }
}, { immediate: true });


// 認証ヘッダーの取得
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (props.jwtToken) {
    headers['Authorization'] = `Bearer ${props.jwtToken}`;
  }
  return headers;
};

// リマインダー取得
const fetchReminders = async () => {
  if (!props.jwtToken) {
    ElMessage.info('認証トークンがありません。リマインダーを読み込みません。');
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
      reminders.value = [];
      return;
    }
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'リマインダーの取得に失敗しました。');
    }
    const data = await response.json();
    reminders.value = data;
  } catch (err) {
    console.error('リマインダー取得エラー:', err);
    fetchError.value = err.message || 'リマインダーの読み込み中にエラーが発生しました。';
    ElMessage.error(fetchError.value);
  } finally {
    loadingReminders.value = false;
  }
};

// リマインダー作成
const createReminder = async () => {
  if (!props.jwtToken) {
    ElMessage.warning('リマインダーを作成するにはログインが必要です。');
    return;
  }
  if (!newReminder.value.customTitle || !newReminder.value.remindDate || !newReminder.value.remindTime) {
    createError.value = 'タイトル、通知日、通知時間は必須です。';
    return;
  }

  createError.value = null;
  try {
    const headers = getAuthHeaders();
    const url = new URL(REMINDER_API_URL);
    // Googleカレンダー連携が強制されるため、常にtrueを渡す
    url.searchParams.append('linkToGoogleCalendar', 'true'); 

    // ★修正: Googleアクセストークンの事前チェックとヘッダー追加ロジックは削除
    // バックエンドからの307リダイレクトのみを処理する

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        customTitle: newReminder.value.customTitle,
        description: newReminder.value.description,
        remindDate: newReminder.value.remindDate,
        remindTime: newReminder.value.remindTime,
        // ★修正: バックエンドのReminderRequestに合わせる
        recurrenceType: newReminder.value.recurrenceType, 
        nextRemindTime: newReminder.value.nextRemindTime,
        attendeeEmails: newReminder.value.attendeeEmails
      })
    });

    // 307リダイレクトを最初にチェック（バックエンドから再認証を求められた場合）
    if (response.status === 307) {
      const responseData = await response.json(); // リダイレクトURLを含むJSONをパース
      if (responseData && responseData.redirectUrl) {
        ElMessage.info('Google カレンダー連携のため、Google 認証にリダイレクトします。');
        window.location.href = responseData.redirectUrl; // Google 認証フローへリダイレクト
      } else {
        // 万が一、307なのにredirectUrlがない場合のフォールバック
        createError.value = 'Google認証リダイレクトURLが見つかりません。';
        ElMessage.error(createError.value);
      }
      return; // 307を処理したらここで関数を終了
    }

    if (response.status === 401 || response.status === 403) {
      ElMessage.error('認証情報が無効です。再度ログインしてください。');
      localStorage.removeItem('token');
      return;
    }
    if (!response.ok) { // 307以外のエラー（400, 500など）をここで処理
      const errorData = await response.json();
      throw new Error(errorData.message || 'リマインダーの作成に失敗しました。');
    }

    // 正常な2xxレスポンスの場合
    await response.json(); 
    
    ElMessage.success('リマインダーを作成しました！');
    // ★修正: newReminderの初期化時にstatusを削除し、追加したフィールドも初期化
    newReminder.value = { 
      customTitle: '', 
      description: '', 
      remindDate: '', 
      remindTime: '', 
      recurrenceType: 'NONE', 
      nextRemindTime: '', 
      attendeeEmails: [] 
    };
    fetchReminders(); // リマインダーリストを更新

  } catch (err) {
    console.error('リマインダー作成エラー:', err);
    const errorMessage = err.message || 'リマインダーの作成中にエラーが発生しました。';
    createError.value = errorMessage;
    ElMessage.error(errorMessage);
  }
};

// リマインダー削除
const deleteReminder = async (id) => {
  if (!props.jwtToken) {
    ElMessage.warning('リマインダーを削除するにはログインが必要です。');
    return;
  }

  try {
    await ElMessageBox.confirm('本当にこのリマインダーを削除しますか？', '確認', {
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      type: 'warning',
    });

    const headers = getAuthHeaders();
    const response = await fetch(`${REMINDER_API_URL}/${id}`, {
      method: 'DELETE',
      headers: headers
    });

    if (response.status === 401 || response.status === 403) {
      ElMessage.error('認証情報が無効です。再度ログインしてください。');
      localStorage.removeItem('token');
      return;
    }
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'リマインダーの削除に失敗しました。');
    }

    ElMessage.success('リマインダーを削除しました。');
    fetchReminders();
  } catch (err) {
    if (err === 'cancel') {
      ElMessage.info('削除をキャンセルしました。');
      return;
    }
    console.error('リマインダー削除エラー:', err);
    ElMessage.error(err.message || 'リマインダーの削除中にエラーが発生しました。');
  }
};

// リマインダーの表示（ログイン状態に応じてフィルタリング）
const filteredReminders = computed(() => {
  return props.jwtToken ? reminders.value : [];
});

// 日付と時刻のフォーマット
const formatDateTime = (dateString, timeString) => {
  if (!dateString || !timeString) return '';

  try {
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

// nextRemindTimeのフォーマット (ISO_LOCAL_DATE_TIME形式を想定)
const formatNextRemindTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  try {
    const date = new Date(dateTimeString); // ISO 8601形式はDateオブジェクトで直接パース可能
    if (isNaN(date)) return 'Invalid Date/Time';

    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error("Next Remind Time formatting error:", e);
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

label {
  display: block;
  text-align: left;
  margin-bottom: 5px;
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
  margin-top: 10px;
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

/*Googleログインボタンのスタイル */
.google-login-button {
  display: inline-block; /* aタグをボタンのように見せる */
  margin-top: 15px;
  background-color: #db4437; /* Googleの赤色 */
  color: white;
  text-decoration: none; /* 下線を消す */
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.google-login-button:hover {
  background-color: #c33d2e;
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
  color: #4CAF50;
  font-weight: bold;
}

/* 新しいチェックボックスコンテナのスタイル */
.checkbox-container {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.checkbox-container input[type="checkbox"] {
  margin-right: 8px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-container label {
  margin-bottom: 0; /* 親のlabelスタイルを上書き */
  font-weight: normal; /* 親のlabelスタイルを上書き */
  cursor: pointer;
}
</style>