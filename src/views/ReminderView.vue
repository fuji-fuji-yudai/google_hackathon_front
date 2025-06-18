<script setup>
import { ref, onMounted } from 'vue';

// Element Plusのコンポーネントを使う場合は、ここでインポートをコメントアウト解除してください
import { ElMessage } from 'element-plus';//藤枝修正箇所
//重要: JWTトークンをlocalStorageから取得 Login.vueでlocalStorage.setItem('token', response.data.token) で保存されていることを前提とします。
const jwtToken = ref(localStorage.getItem('token') || null);

const reminders = ref([]);
const newReminderTitle = ref('');
const newReminderDate = ref('');
const newReminderTime = ref('');
const newReminderDescription = ref('');
// 初期値を'PENDING'に固定
const newReminderStatus = ref('PENDING');

const errorMessage = ref('');

// デプロイされたバックエンドのURLに合わせる
const backendUrl = 'https://my-image-14467698004.asia-northeast1.run.app/api/reminders';

// コンポーネントがマウントされた際に、JWTトークンの存在を確認
onMounted(() => {
  if (jwtToken.value) {
    fetchReminders();
  } else {
    // トークンがない場合、ナビゲーションガードがログインページにリダイレクトするはずですが、万一の場合に備えてエラーメッセージも表示
    errorMessage.value = 'ログインしていません。リマインダーをロードできません。';
    console.warn("JWTトークンがlocalStorageにありません。ログインしてください。");
  }
});

//リマインダー一覧を取得する関数
const fetchReminders = async () => {
  errorMessage.value = ''; // エラーメッセージをクリア
  if (!jwtToken.value) {
    errorMessage.value = 'エラー: 認証トークンがありません。ログインしてください。';
    return;
  }
  try {
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken.value}`, // JWTトークンをAuthorizationヘッダーに含める
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401 || response.status === 403) {
      errorMessage.value = '認証情報が無効です。再度ログインしてください。';
      // 実際のアプリケーションでは、ここで router.push('/') などでログインページへ遷移させます
      console.error('認証エラー: トークンが無効または期限切れです。');
      return;
    }
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'リマインダーの取得に失敗しました。');
    }

    reminders.value = await response.json(); // 取得したリマインダーをリアクティブ変数に格納
  } catch (error) {
    console.error('API Error (fetchReminders):', error);
    errorMessage.value = error.message || 'リマインダーの取得中に予期せぬエラーが発生しました。';
  }
};

// 新しいリマインダーを作成する関数
const createReminder = async () => {
  errorMessage.value = '';
  if (!jwtToken.value) {
    errorMessage.value = 'エラー: 認証トークンがありません。ログインしてください。';
    return;
  }
  // 必須入力項目のチェック
  if (!newReminderTitle.value || !newReminderDate.value || !newReminderTime.value) {
    errorMessage.value = 'タイトル、日付、時刻は必須です。';
    return;
  }

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customTitle: newReminderTitle.value,
        remindDate: newReminderDate.value,
        remindTime: newReminderTime.value,
        description: newReminderDescription.value,
        // ここで常に'PENDING'を送信
        status: newReminderStatus.value, // newReminderStatusは常に'PENDING'
      }),
    });

    if (response.status === 401 || response.status === 403) {
      errorMessage.value = '認証情報が無効です。再度ログインしてください。';
      return;
    }
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'リマインダーの作成に失敗しました。');
    }

    // 作成成功後、リマインダーリストを再取得して表示を更新
    await fetchReminders();
    // フォーム入力値をクリア
    newReminderTitle.value = '';
    newReminderDate.value = '';
    newReminderTime.value = '';
    newReminderDescription.value = '';
    newReminderStatus.value = 'PENDING'; //初期値に戻す（今回は必須ではないが習慣として）
    //Element Plusのメッセージを使うなら 
    ElMessage.success('リマインダーを追加しました！');
  } catch (error) {
    console.error('API Error (createReminder):', error);
    errorMessage.value = error.message || 'リマインダーの作成中に予期せぬエラーが発生しました。';
    // Element Plusのメッセージを使うなら 
    ElMessage.error(errorMessage.value);
  }
};

// リマインダーを削除する関数
const deleteReminder = async (id) => {
  errorMessage.value = '';
  if (!jwtToken.value) {
    errorMessage.value = 'エラー: 認証トークンがありません。ログインしてください。';
    return;
  }
  try {
    const response = await fetch(`${backendUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${jwtToken.value}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      errorMessage.value = '認証情報が無効です。再度ログインしてください。';
      return;
    }
    // DELETE成功は通常204 No Contentを返すため、response.okでなくstatusコードで直接チェック
    if (response.status !== 204) {
      const errorData = await response.json(); // エラーレスポンスがあれば取得
      throw new Error(errorData.message || 'リマインダーの削除に失敗しました。');
    }

    //削除成功後、リマインダーリストを再取得して表示を更新
    await fetchReminders();
    //Element Plusのメッセージを使うなら 
    ElMessage.success('リマインダーを削除しました！');
  } catch (error) {
    console.error('API Error (deleteReminder):', error);
    errorMessage.value = error.message || 'リマインダーの削除中に予期せぬエラーが発生しました。';
    // Element Plusのメッセージを使うなら 
    ElMessage.error(errorMessage.value);
  }
};
</script>

<template>
  <div class="reminder-view">
    <h2>新しいリマインダーを作成</h2>
    <form @submit.prevent="createReminder">
      <div>
        <label for="newTitle">タイトル:</label>
        <input type="text" id="newTitle" v-model="newReminderTitle" required />
        </div>
      <div>
        <label for="newDate">日付:</label>
        <input type="date" id="newDate" v-model="newReminderDate" required />
        </div>
      <div>
        <label for="newTime">時刻:</label>
        <input type="time" id="newTime" v-model="newReminderTime" required />
        </div>
      <div>
        <label for="newDescription">説明:</label>
        <textarea id="newDescription" v-model="newReminderDescription"></textarea>
        </div>
      <button type="submit">リマインダー追加</button> <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>

    <h2>あなたのリマインダー</h2>
    <p v-if="reminders.length === 0 && !errorMessage">リマインダーがありません。</p>
    <ul v-else-if="reminders.length > 0">
      <li v-for="reminder in reminders" :key="reminder.id" class="reminder-item">
        <div>
          <h3>{{ reminder.customTitle }}</h3>
          <p>日時: {{ reminder.remindDate }} {{ reminder.remindTime }}</p>
          <p v-if="reminder.description">説明: {{ reminder.description }}</p>
          <p>ステータス: {{ reminder.status }}</p>
        </div>
        <button @click="deleteReminder(reminder.id)">削除</button> </li>
    </ul>
    <p v-else-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
/* このコンポーネント固有のスタイル */
.reminder-view {
  padding: 20px;
  max-width: 800px; /* 全体の幅を制限 */
  margin: 0 auto; /* 中央寄せ */
}

form {
  margin-bottom: 40px;
  border: 1px solid #e0e0e0; /* フォームの境界線 */
  border-radius: 8px;
  padding: 25px;
  display: inline-block; /* フォーム自体をブロック要素にし、中央寄せを維持 */
  box-shadow: 0 4px 8px rgba(0,0,0,0.05); /* 軽い影 */
  background-color: #fff;
  width: 100%; /* 親要素の幅いっぱいに */
  box-sizing: border-box; /* paddingを含めた幅 */
}

form div {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

form label {
  flex-shrink: 0;
  width: 100px; /* ラベルの幅を固定 */
  text-align: right;
  margin-right: 20px;
  font-weight: bold;
  color: #555;
}

form input[type="text"],
form input[type="date"],
form input[type="time"],
form textarea,
form select { /* selectは残しておいても影響ないが、スタイルとして不要になる */
  flex-grow: 1; /* 残りのスペースを埋める */
  padding: 10px 12px;
  border-radius: 5px;
  border: 1px solid #ccc;
  font-size: 16px;
  box-sizing: border-box; /* paddingを含めた幅 */
}

form textarea {
  min-height: 80px;
  resize: vertical;
}

button {
  padding: 10px 20px;
  background-color: #4CAF50; /* 緑色 */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
}
button:hover {
  background-color: #45a049;
}
button[type="danger"] { /* 削除ボタン用 */
  background-color: #f44336; /* 赤色 */
}
button[type="danger"]:hover {
  background-color: #da190b;
}


.error-message {
  color: #d32f2f; /* より目立つ赤色 */
  margin-top: 15px;
  font-weight: bold;
}

h2 {
  color: #333;
  margin-top: 40px;
  margin-bottom: 20px;
}

.reminder-list ul {
  list-style: none;
  padding: 0;
  width: 100%; /* 親要素の幅いっぱいに */
}

.reminder-item {
  background-color: #f0f8ff; /* やや水色の背景 */
  border: 1px solid #b0e0e6; /* 境界線 */
  margin-bottom: 12px;
  padding: 20px;
  border-radius: 8px;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.08); /* 少し強めの影 */
  transition: all 0.3s ease; /* ホバー効果 */
}

.reminder-item:hover {
  transform: translateY(-3px); /* わずかに浮き上がる */
  box-shadow: 0 4px 10px rgba(0,0,0,0.12);
}

.reminder-item div {
  flex-grow: 1; /* テキスト部分がスペースを占める */
}

.reminder-item h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 1.2em;
}

.reminder-item p {
  margin: 0 0 4px 0;
  color: #666;
  font-size: 0.95em;
  line-height: 1.4;
}

.reminder-item p:last-child {
  margin-bottom: 0;
}
</style>