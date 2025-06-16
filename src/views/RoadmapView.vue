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
import RoadmapChat from '../components/RoadmapChat.vue'; // RoadmapChatもインポート

export default {
  name: 'RoadmapView',
  components: {
    RoadmapBase,
    RoadmapChat // ここでも使用するので追加
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
  /* ★ここを削除またはコメントアウト */
  /* overflow: hidden; */ 
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 0;
  position: relative;
  min-height: 100vh; /* 少なくともビューポートの高さにする */
  display: flex;
  flex-direction: column;
}

/* ページヘッダーのスタイル */
.page-header {
  background-color: #fcfcfc; /* 白い背景 */
  padding: 20px 0; /* 上下のパディングを調整 */
  border-bottom: 1px solid #eee; /* 下線 */
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  position: relative; /* z-indexのために必要 */
  z-index: 10; /* コンテンツより手前に表示 */
  flex-shrink: 0; /* ヘッダーが縮まないように固定 */
}

.page-header .header-content {
  display: flex;
  justify-content: center; /* ロードマップh1を中央に */
  align-items: center;
  position: relative;
  max-width: 1200px; /* 必要に応じてヘッダーコンテンツの最大幅を調整 */
  margin: 0 auto; /* 中央寄せ */
}

.page-header h1 {
  margin: 0; /* h1のデフォルトマージンをリセット */
  font-size: 2.5em;
  color: #333;
}

.header-link {
  position: absolute; /* ヘッダーコンテンツ内で絶対配置 */
  left: 20px; /* 左端から20px */
  top: 50%; /* 垂直方向中央 */
  transform: translateY(-50%); /* 垂直方向中央寄せの調整 */
  font-size: 1.1em;
  color: #007bff;
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 5px;
  transition: background-color 0.2s ease;
  white-space: nowrap; /* テキストが折り返さないように */
}

.header-link:hover {
  background-color: #e9f0f8;
  text-decoration: underline;
}


/* メインコンテンツラッパー */
.main-content-wrapper {
  flex-grow: 1; /* 残りのスペースを埋める */
  display: flex;
  justify-content: center; /* RoadmapBaseを中央寄せにするため */
  padding: 20px; /* 上下左右に20pxパディング */
  overflow-y: auto; /* コンテンツがはみ出したらスクロール */
  box-sizing: border-box; /* paddingを含めて幅を計算 */
  /* ★下記を追加: これが重要 */
  height: 0; /* flex-grow: 1; と組み合わせて利用可能な残りの高さを占める */
}

/* チャット開閉ボタン */
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

/* サイドバーが開いているときにボタンをずらす */
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
  right: -350px; /* デフォルトで画面外に隠す */
  width: 350px; /* サイドバーの幅 */
  height: 100%;
  background-color: #f0f2f5; /* サイドバーの背景色 */
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.2);
  transition: right 0.3s ease-in-out; /* スムーズなアニメーション */
  z-index: 1002; /* モーダルなどより手前に表示 */
  display: flex;
  flex-direction: column;
}

.chat-sidebar.is-open {
  right: 0; /* サイドバーが開いている状態 */
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
  background-color: rgba(0, 0, 0, 0.3); /* 半透明の黒 */
  z-index: 1000; /* サイドバーより奥、コンテンツより手前 */
}
</style>