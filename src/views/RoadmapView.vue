<template>
  <div id="app">
    <header class="page-header">
      <div class="header-content">
        <h1>ロードマップ</h1>
      </div>
    </header>

    <main class="main-content-wrapper">
      <RoadmapBase />
    </main>

    <router-link
      to="/reminders"
      class="fixed-reminder-button"
    >
      リマインダー作成
    </router-link>
    <button
      class="chat-toggle-button"
      @click="toggleChatSidebar"
    >
      <span v-if="isChatSidebarOpen">チャットを閉じる</span>
      <span v-else>AIにチャットで質問する</span>
    </button>

    <aside :class="['chat-sidebar', { 'is-open': isChatSidebarOpen }]">
      <div class="sidebar-header">
        <h2>ロードマップ作成相談</h2>
        <button
          class="close-sidebar-button"
          @click="toggleChatSidebar"
        >
          ×
        </button>
      </div>
      <RoadmapChat />
    </aside>

    <div
      v-if="isChatSidebarOpen"
      class="sidebar-overlay"
      @click="toggleChatSidebar"
    />
  </div>
</template>

<script>
import RoadmapBase from '../components/RoadmapBase.vue';
import RoadmapChat from '../components/RoadmapChat.vue';

export default {
  name: 'RoadmapView',
  components: {
    RoadmapBase,
    RoadmapChat
  },
  data() {
    return {
      isChatSidebarOpen: false
    };
  },
  methods: {
    toggleChatSidebar() {
      this.isChatSidebarOpen = !this.isChatSidebarOpen;
    },
  }
}
</script>

<style>
/* RoadmapView.vue のグローバルスタイル */
body {
  margin: 0;
  padding: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 0;
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ページヘッダーのスタイル */
.page-header {
  background-color: #fcfcfc;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.page-header .header-content {
  display: flex;
  justify-content: center; /* h1を中央に */
  align-items: center;
  position: relative; /* 必要であれば */
  max-width: 1200px;
  margin: 0 auto;
}

.page-header h1 {
  margin: 0;
  font-size: 2.5em;
  color: #333;
}

/* ▼修正: 画面左上に固定されるリマインダー作成ボタンのスタイル */
.fixed-reminder-button {
  position: fixed; /* 画面に固定 */
  top: 20px; /* 上からの距離 */
  left: 20px; /* 左からの距離 */
  background-color: #4CAF50; /* 緑色に変更 */
  color: white;
  padding: 10px 15px; /* AIボタンと同じパディング */
  border: none;
  border-radius: 5px; /* AIボタンと同じ角丸 */
  cursor: pointer;
  font-size: 16px; /* AIボタンと同じフォントサイズ */
  z-index: 1001; /* AIボタンと同じz-indexで手前に表示 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); /* AIボタンと同じ影 */
  white-space: nowrap; /* テキストが折り返さないように */
  text-decoration: none; /* リンクの下線なし */
  display: inline-block; /* リンクをブロック要素のように扱い、パディングなどを有効にする */
}

.fixed-reminder-button:hover {
  background-color: #45a049; /* ホバー時に少し濃い緑色に変更 */
}
/* ▲修正 */

/* メインコンテンツラッパー */
.main-content-wrapper {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
  box-sizing: border-box;
  height: 0;
}

/* 元の、画面右上に固定されているAIチャットボタン (これは変更なしで維持) */
.chat-toggle-button {
  position: fixed; /* 画面右上に固定 */
  top: 20px;
  right: 20px;
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  z-index: 1001; /* サイドバーより手前に表示 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  white-space: nowrap; /* テキストが折り返さないように */
  transition: right 0.3s ease-out; /* サイドバー開閉時の移動アニメーション */
}

/* サイドバーが開いているときにボタンをずらす (元の.chat-toggle-button用なので維持) */
.chat-sidebar.is-open ~ .chat-toggle-button {
  right: 370px; /* サイドバーの幅(350px) + 余白(20px) = 370px */
}

.chat-toggle-button:hover {
  background-color: #0056b3;
}

/* チャットサイドバー */
.chat-sidebar {
  position: fixed;
  top: 0;
  right: -350px;
  width: 350px;
  height: 100%;
  background-color: #f0f2f5;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.2);
  transition: right 0.3s ease-in-out;
  z-index: 1002;
  display: flex;
  flex-direction: column;
}

.chat-sidebar.is-open {
  right: 0;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fff;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.2em;
  color: #333;
}

.close-sidebar-button {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #666;
  padding: 5px;
}

.close-sidebar-button:hover {
  color: #333;
}

/* サイドバーが開いているときのオーバーレイ */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1000;
}
</style>