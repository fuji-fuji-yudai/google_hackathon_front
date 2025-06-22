<!-- このファイルへの記載内容は全vueファイルに反映される -->
<template>
  <div id="app">
    <!-- ナビバー -->
    <nav>
      <router-link to="/home" class="logo-link">
        <img src="/favicon.png" alt="WorkLoop Logo" class="logo-image" />
      </router-link>

      <div class="nav-links">
        <router-link to="/">
          Login
        </router-link>
        <router-link to="/home">
          Home
        </router-link>
        <router-link to="/chat">
          Chat
        </router-link>
        <router-link to="/reflection/home">
          Reflection
        </router-link>
        <router-link to="/roadmap">
          Roadmap
        </router-link>
        <router-link to="/taskManage">
          Task
        </router-link>
      </div>
      <div 
        v-show="true" 
        class="user-info" 
      >
        {{ currentUsername ? currentUsername +' さん' : ''}} 
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import emitter from './eventBus'

const currentUsername = ref(null)

const getUsernameFromToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub || payload.username
  } catch {
    return null
  }
}

const updateUsername = () => {
  const token = localStorage.getItem('token')
  currentUsername.value = getUsernameFromToken(token)
}

onMounted(() => {
  updateUsername()
  emitter.on('login-success', updateUsername) // ← ここでイベントを受け取る
})
</script>



<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

nav {
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between; /* ← 左右に分ける */
  border-bottom: 1px solid #e0e0e0;

  .nav-links {
    display: flex;
    gap: 3.5rem;
    align-items: center;
  }

  .user-info {
    font-weight: 600;
    color: #2c3e50;
    font-size: 0.95rem;
    white-space: nowrap;
  }

  a {
    font-weight: 600;
    color: #2c3e50;
    text-decoration: none;
    font-size: 0.95rem;
    position: relative;
    padding: 0.25rem 0;

    &::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: 0;
      width: 0%;
      height: 2px;
      background-color: #42b983;
      transition: width 0.3s ease;
    }

    &:hover::after {
      width: 100%;
    }

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}


router-view {
 flex: 1;
 overflow: auto;
}

.logo-link {
  display: flex;
  align-items: center;
  margin-right: 1.5rem;

  .logo-image {
    height: 32px;
    width: auto;
  }
}


</style>


