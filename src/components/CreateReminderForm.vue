<template>
  <div class="create-reminder-container">
    <h2>リマインドを作成</h2>

    <form @submit.prevent="submitReminder" class="reminder-form">
      <div class="form-grid">
        <div class="form-row">
          <label for="reminder-title">リマインドタイトル:</label>
          <input
            type="text"
            id="reminder-title"
            v-model="newReminder.customTitle"
            placeholder="例: AWS SAAの勉強、CEFR受験申込期限"
            required
            class="input-field"
          />
        </div>

        <div class="form-row">
          <label for="remind-date">リマインド日付:</label>
          <input
            type="date"
            id="remind-date"
            v-model="newReminder.remindDate"
            required
            class="input-field"
          />
        </div>

        <div class="form-row">
          <label for="remind-time">リマインド時間 (任意):</label>
          <input
            type="time"
            id="remind-time"
            v-model="newReminder.remindTime"
            class="input-field"
          />
        </div>

        <div class="form-row">
          <label for="reminder-description">詳細 (任意):</label>
          <textarea
            id="reminder-description"
            v-model="newReminder.description"
            placeholder="リマインダーに関する追加情報やメモ"
            class="input-field textarea-field"
          ></textarea>
        </div>
      </div>

      <button type="submit" class="submit-button">リマインドを作成</button>
    </form>

    <div v-if="successMessage" class="message success">{{ successMessage }}</div>
    <div v-if="errorMessage" class="message error">{{ errorMessage }}</div>
  </div>
</template>

<script>
import axios from 'axios'; // バックエンド連携用にaxiosをインポート

export default {
  name: 'CreateReminderForm',
  data() {
    return {
      newReminder: {
        customTitle: '',
        remindDate: '',
        remindTime: '09:00', // デフォルト時間
        description: '', // 新しく追加した詳細フィールド
        // qualification: null, // この画面では関連資格の選択は含めない
      },
      successMessage: '',
      errorMessage: '',
      API_BASE_URL: 'http://localhost:8080/api/reminders', // Spring BootバックエンドのURL
    };
  },
  methods: {
    async submitReminder() {
      this.successMessage = '';
      this.errorMessage = '';

      if (!this.newReminder.customTitle || !this.newReminder.remindDate) {
        this.errorMessage = 'リマインダータイトルと日付は必須です。';
        return;
      }

      // 送信するデータはバックエンドのReminderエンティティに合わせて調整
      const payload = {
        customTitle: this.newReminder.customTitle,
        remindDate: this.newReminder.remindDate,
        remindTime: this.newReminder.remindTime || null, // 空の場合はnullを送信
        description: this.newReminder.description || null, // 新しく追加した詳細フィールド
        // qualification: null // このフォームでは設定しない
      };

      console.log('Sending reminder payload:', payload);

      try {
        // バックエンドのエンドポイントに合わせてPOSTリクエストを送信
        // 例: await axios.post(`${this.API_BASE_URL}/reminders`, payload);
        
        // 実際のアプリケーションでは、上の行を有効にし、以下のsetTimeoutを削除してください。
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒の遅延をシミュレート
        console.log('Reminder submitted successfully (simulated).');
        // ↑ここまでダミー処理

        this.successMessage = 'リマインダーが正常に作成されました！';
        this.resetForm(); // フォームをリセット
        // リマインダーリストの更新が必要な場合は、親コンポーネントにイベントを発行する
        // this.$emit('reminder-created');

      } catch (error) {
        console.error('リマインダーの作成に失敗しました:', error.response ? error.response.data : error.message);
        this.errorMessage = 'リマインダーの作成に失敗しました。エラー: ' + (error.response ? error.response.data.message : error.message);
      }
    },
    resetForm() {
      this.newReminder = {
        customTitle: '',
        remindDate: '',
        remindTime: '09:00',
        description: '',
      };
    },
  },
};
</script>

<style scoped>
.create-reminder-container {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 600px;
  margin: 40px auto;
  padding: 30px;
  background-color: #fcfcfc;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  text-align: center; /* h2などを中央寄せ */
}

h2 {
  font-size: 2.2em;
  color: #2c3e50;
  margin-bottom: 30px;
  border-bottom: 2px solid #eee;
  padding-bottom: 15px;
}

.reminder-form {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.form-grid {
  display: grid;
  gap: 20px; /* 行間のスペース */
  margin-bottom: 30px;
}

.form-row {
  display: flex;
  flex-direction: column; /* ラベルと入力フィールドを縦に配置 */
  align-items: flex-start; /* 左寄せ */
}

.form-row label {
  font-weight: bold;
  color: #555;
  font-size: 0.95em;
  margin-bottom: 8px; /* ラベルと入力フィールドの間のスペース */
}

.input-field {
  width: 100%; /* 親要素いっぱいに広げる */
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1em;
  box-sizing: border-box; /* paddingとborderをwidthに含める */
  background-color: #fdfdfd;
  color: #333;
}

.input-field:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
  outline: none;
}

.textarea-field {
  min-height: 100px;
  resize: vertical; /* 縦方向のみリサイズ可能 */
}

.submit-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 25px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  font-weight: bold;
  letter-spacing: 0.8px;
  margin-top: 20px;
  width: auto; /* コンテンツに合わせて幅を調整 */
}

.submit-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.message {
  margin-top: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  text-align: center;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>