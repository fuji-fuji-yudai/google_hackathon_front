<template>
  <div id="app">
    <header class="page-header">
      <div class="header-content">
        <h1>ロードマップ</h1>
      </div>
    </header>

    <main class="main-content-wrapper">
      <RoadmapBase :roadmapData="roadmapData" @update-roadmap="handleUpdateRoadmap" />
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
import axios from 'axios';
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
      isChatSidebarOpen: false,
      // ロードマップデータを保持する配列
      roadmapData: [] // データベースから取得したデータが格納される
    };
  },
  methods: {
    toggleChatSidebar() {
      this.isChatSidebarOpen = !this.isChatSidebarOpen;
    },

    // ロードマップデータを全てDBから取得するメソッド
    async fetchRoadmapData() {
      try {
        const response = await axios.get('/api/roadmap');
        this.roadmapData = response.data;
        console.log('ロードマップデータを取得しました:', this.roadmapData);
      } catch (error) {
        console.error('ロードマップデータの取得に失敗しました:', error);
        // TODO: エラー処理 (ユーザーへの通知など)
      }
    },

    // ロードマップエントリをDBに保存するメソッド
    // entry の形式は { categoryName: '...', taskName: '...', startMonth: '...', endMonth: '...' } と想定
    async saveRoadmapEntry(entry) {
      try {
        const response = await axios.post('/api/roadmap', entry);
        this.roadmapData.push(response.data); // 成功したら、返されたID付きの新しいエントリをroadmapDataに追加
        console.log('ロードマップエントリを保存しました:', response.data);
        return response.data;
      } catch (error) {
        console.error('ロードマップエントリの保存に失敗しました:', error);
        throw error;
      }
    },

    // ロードマップエントリをDBで更新するメソッド
    // updatedEntry の形式は { categoryName: '...', taskName: '...', startMonth: '...', endMonth: '...' } と想定
    async updateRoadmapEntry(id, updatedEntry) {
      try {
        const response = await axios.put(`/api/roadmap/${id}`, updatedEntry);
        const index = this.roadmapData.findIndex(item => item.id === id);
        if (index !== -1) {
          this.roadmapData.splice(index, 1, response.data); // Vueのリアクティブな更新のために splice を使用
        }
        console.log('ロードマップエントリを更新しました:', response.data);
        return response.data;
      } catch (error) {
        console.error(`ロードマップエントリ (ID: ${id}) の更新に失敗しました:`, error);
        throw error;
      }
    },

    // ロードマップエントリをDBから削除するメソッド (変更なし)
    async deleteRoadmapEntry(id) {
      try {
        await axios.delete(`/api/roadmap/${id}`);
        this.roadmapData = this.roadmapData.filter(item => item.id !== id);
        console.log(`ロードマップエントリ (ID: ${id}) を削除しました。`);
      } catch (error) {
        console.error(`ロードマップエントリ (ID: ${id}) の削除に失敗しました:`, error);
        throw error;
      }
    },

    // RoadmapBaseからのイベントを受け取るハンドラ
    // payload.entry の形式は { categoryName: '...', taskName: '...', startMonth: '...', endMonth: '...' } と想定
    async handleUpdateRoadmap(payload) {
        if (payload.action === 'save') {
            await this.saveRoadmapEntry(payload.entry);
        } else if (payload.action === 'update') {
            await this.updateRoadmapEntry(payload.id, payload.entry);
        } else if (payload.action === 'delete') {
            await this.deleteRoadmapEntry(payload.id);
        }
        // 必要に応じて、データを再フェッチすることも検討（例：複数箇所での更新でデータの整合性を確保したい場合）
        // await this.fetchRoadmapData();
    }
  },
  // コンポーネントがマウントされたときにデータを取得する
  async created() {
    await this.fetchRoadmapData();
  }
}
</script>

<style>
/* ... スタイルは変更なし ... */
</style>