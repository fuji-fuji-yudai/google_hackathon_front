<template>
  <div class="chat-container">
    <h2>Gemini 質問フォーム</h2>
    <textarea v-model="userQuestion" placeholder="質問を入力してください..." rows="4"></textarea>
    <button @click="sendQuestion" :disabled="loading">
      {{ loading ? '送信中...' : '送信' }}
    </button>

    <div v-if="answer" class="response">
      <h3>回答:</h3>
      <p>{{ answer }}</p>
    </div>

    <div v-if="error" class="error">
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      userQuestion: '',
      answer: '',
      error: '',
      loading: false,
    };
  },
  methods: {
    async sendQuestion() {
      this.loading = true;
      this.answer = '';
      this.error = '';

      try {
        const response = await fetch('https://my-image-14467698004.asia-northeast1.run.app/api/gemini/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: this.userQuestion,
            similarMessages: [], // 必要に応じて履歴を渡す
          }),
        });

        if (!response.ok) {
          throw new Error('サーバーエラーが発生しました');
        }

        const data = await response.json();
        this.answer = data.answer;
      } catch (err) {
        this.error = err.message || '通信エラーが発生しました';
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.chat-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
textarea {
  width: 100%;
  margin-bottom: 1rem;
}
button {
  padding: 0.5rem 1rem;
}
.response {
  margin-top: 1rem;
  background: #f0f8ff;
  padding: 1rem;
  border-radius: 4px;
}
.error {
  margin-top: 1rem;
  color: red;
}
</style>
