<template>
  <div class="roadmap-manager-container">
    <h2>ロードマップ編集</h2>

    <div class="action-buttons">
      <button class="action-button chat-button" @click="openAIChatModal">
        AIにチャットで質問
      </button>
      <button class="action-button reminder-button" @click="goToReminderForm">
        リマインダー作成
      </button>
      <button class="save-roadmap-button" @click="emit('save-roadmap-data')" v-if="false">
        データ保存 (自動保存有効中)
      </button>
    </div>

    <p v-if="props.loading" class="loading-message">ロードマップデータを読み込み中...</p>
    <p v-if="props.apiError" class="error-message">エラー: {{ props.apiError }}</p>
    <p v-if="!props.jwtToken && !props.loading" class="warning-message">
      ロードマップの表示はできますが、変更を保存するにはログインが必要です。
    </p>

    <RoadmapBase
      :roadmap-data="props.roadmapData"
      :all-months="props.allMonths"
      :all-quarters="props.allQuarters"
      :initial-category-colors="props.categoryColors"
      @add-task-to-manager="handleAddTask"
      @save-task-edit-to-manager="handleSaveTaskEdit"
      @delete-task-to-manager="handleDeleteTask"
    />

    <div v-if="isAIChatModalOpen" class="ai-chat-modal-overlay" @click.self="closeAIChatModal">
      <div class="ai-chat-modal-content">
        <RoadmapChat />
        <button class="close-button" @click="closeAIChatModal">閉じる</button>
      </div>
    </div>

    <div v-if="isReminderModalOpen" class="reminder-modal-overlay" @click.self="closeReminderModal">
      <div class="reminder-modal-content">
        <ReminderView />
        <button class="close-button" @click="closeReminderModal">閉じる</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

import RoadmapBase from './RoadmapBase.vue';
import RoadmapChat from './RoadmapChat.vue';
import ReminderView from '../views/ReminderView.vue';

const props = defineProps({
  jwtToken: {
    type: String,
    default: null,
  },
  loading: {
    type: Boolean,
    default: true,
  },
  apiError: {
    type: String,
    default: null,
  },
  roadmapData: {
    type: Array,
    required: true,
  },
  categoryColors: {
    type: Object,
    required: true,
  },
  allMonths: {
    type: Array,
    required: true,
  },
  allQuarters: {
    type: Array,
    required: true,
  },
});

// 親コンポーネント (RoadmapView.vue) にイベントを伝えるための emit を定義
const emit = defineEmits([
  'add-task-to-manager',
  'save-task-edit-to-manager',
  'delete-task-to-manager',
  'request-logout', // 親へのログアウト要求イベント
  'save-roadmap-data' // 自動保存のインフォメーション表示のため、念のためエミットも定義
]);

// RoadmapBase から受け取ったタスク追加イベントを親にエミット
const handleAddTask = (taskPayload) => {
  // デバッグ用にペイロードの内容をログ出力すると良いでしょう
  console.log('RoadmapManager: handleAddTask received payload:', taskPayload);
  emit('add-task-to-manager', taskPayload);
};

// RoadmapBase から受け取ったタスク編集イベントを親にエミット
const handleSaveTaskEdit = (updatedTask) => {
  // デバッグ用にペイロードの内容をログ出力すると良いでしょう
  console.log('RoadmapManager: handleSaveTaskEdit received payload:', updatedTask);
  emit('save-task-edit-to-manager', updatedTask);
};

// RoadmapBase から受け取ったタスク削除イベントを親にエミット
const handleDeleteTask = (taskIdToDelete) => {
  // デバッグ用にIDをログ出力すると良いでしょう
  console.log('RoadmapManager: handleDeleteTask received ID:', taskIdToDelete);
  emit('delete-task-to-manager', taskIdToDelete);
};

// AIチャットモーダルの表示状態
const isAIChatModalOpen = ref(false);
const openAIChatModal = () => { isAIChatModalOpen.value = true; };
const closeAIChatModal = () => { isAIChatModalOpen.value = false; };

// リマインダーモーダルの表示状態
const isReminderModalOpen = ref(false);
const goToReminderForm = () => { isReminderModalOpen.value = true; };
const closeReminderModal = () => { isReminderModalOpen.value = false; };
</script>

<style scoped>
/* スタイルは変更なし */
.roadmap-manager-container {
  padding: 20px;
  max-width: 1500px; 
  width: 95%; 
  margin: 20px auto;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h2 {
  color: #333;
  margin-bottom: 25px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end; /* ボタンを右寄せに */
  gap: 15px; /* ボタン間のスペース */
  margin-bottom: 20px;
  margin-top: -55px; /* h2 との重なりを調整 */
  padding-right: 20px; /* 右側のパディング */
}

.action-button {
  background-color: #6c757d; /* グレー系の色 */
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.action-button:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.chat-button {
  background-color: #007bff; /* 青系 */
  box-shadow: 0 3px 8px rgba(0, 123, 255, 0.3);
}
.chat-button:hover {
  background-color: #0056b3;
}

.reminder-button {
  background-color: #28a745; /* 緑系 */
  box-shadow: 0 3px 8px rgba(40, 167, 69, 0.3);
}
.reminder-button:hover {
  background-color: #218838;
}

.save-roadmap-button {
  background-color: #007bff;
  color: white;
  padding: 12px 25px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1em;
  font-weight: bold;
  margin-bottom: 30px;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 3px 8px rgba(0, 123, 255, 0.3);
  display: none;
}

.save-roadmap-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.loading-message {
  font-size: 0.9em;
  color: #007bff;
  padding: 8px 15px;
  margin-top: 15px;
  background-color: #e0f7fa;
  border-radius: 5px;
  font-weight: bold;
  display: inline-block;
}

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 15px;
  margin-top: 20px;
  border-radius: 5px;
  font-weight: bold;
}

.warning-message {
  font-size: 1em;
  color: #856404;
  background-color: transparent;
  border: none;
  padding: 0;
  margin-top: 20px;
  font-weight: bold;
}

/* モーダルオーバーレイのスタイル */
.ai-chat-modal-overlay, .reminder-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.ai-chat-modal-content, .reminder-modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  height: 80%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.ai-chat-modal-content h3, .reminder-modal-content h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  text-align: center;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5em;
  color: #666;
  cursor: pointer;
  padding: 5px;
  line-height: 1;
}

.close-button:hover {
  color: #333;
}
</style>