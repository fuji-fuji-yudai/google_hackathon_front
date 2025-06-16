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
        this.$router.push('/home');
      } catch (err) {
        this.error = 'ログインに失敗しました';
      }
    }
  }
};
</script>