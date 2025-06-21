<!-- このファイルへの記載内容は全vueファイルに反映される -->
<template>
  <div id="app">
    <!-- ナビバー -->
    <nav>
      <router-link to="/">
        Home
      </router-link>
      <router-link to="/chat">
        Chat
      </router-link>
      <router-link to="/chat">
        Reflection
      </router-link>
      <router-link to="/chat">
        Roadmap
      </router-link>
      <router-link to="/chat">
        Task
      </router-link>
    </nav>
    <router-view />
  </div>
</template>


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
  padding: 0.75rem 1.5rem; /* ← 高さを抑える */
  display: flex;
  gap: 1.5rem;
  align-items: center;
  justify-content: flex-start;
  border-bottom: 1px solid #e0e0e0;

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

</style>
