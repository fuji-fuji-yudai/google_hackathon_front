<template>
  <div class="login">
    <form @submit.prevent="login">
      <input
        v-model="username"
        placeholder="Username"
      >
      <input
        v-model="password"
        type="password"
        placeholder="Password"
      >
      <button type="submit">
        Login
      </button>
    </form>
    <p v-if="error">
      {{ error }}
    </p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      username: '',
      password: '',
      error: ''
    };
  },
  methods: {
    async login() {
      try {
          const response = await axios.post('https://my-image-14467698004.asia-northeast1.run.app/api/login', 
          {
          username: this.username,
          password: this.password
          },
          {
            withCredentials: true
          }
        );
        // トークンなどを保存
        localStorage.setItem('token', response.data.token);
        window.dispatchEvent(new Event('storage')) 
        this.$router.push('/home');
      } catch (err) {
        this.error = 'ログインに失敗しました';
      }
    }
  }
};
</script>

<style scoped>
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem; /* 上下に余白を追加 */
  min-height: 100vh;
  background-color: #f5f7fa;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 320px;
  margin-top: 2rem; /* ← フォームの上に隙間を追加 */
}

input {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
}

button {
  padding: 0.75rem;
  background-color: #2a5298;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #1e3c72;
}

p {
  color: red;
  margin-top: 1rem;
}
</style>
