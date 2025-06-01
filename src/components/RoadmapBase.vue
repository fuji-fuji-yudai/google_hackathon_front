<template>
  <div class="roadmap-base-container">
    <h2>プロジェクトロードマップ</h2>

    <RoadmapTaskForm @add-task="handleAddTask" />

    <RoadmapGrid
      :tasks="tasks"
      :editedCategoryName="currentEditedCategoryName"
      @update:editedCategoryName="newValue => currentEditedCategoryName = newValue"
      @edit-task="handleEditTask"
      @delete-task="handleDeleteTask"
      @finish-category-edit="handleFinishCategoryEdit"
    />

    <RoadmapTaskEdit
      :show="showEditModal"
      :task="editingTask"
      @close="showEditModal = false"
      @save="handleSaveTask"
    />

    <RoadmapChat />

  </div>
</template>

<script>
import RoadmapGrid from './RoadmapGrid.vue';
import RoadmapTaskForm from './RoadmapTaskForm.vue'; // ファイル名は TaskForm.vue
import RoadmapTaskEdit from './RoadmapTaskEdit.vue'; // ファイル名は TaskEditModal.vue
import RoadmapChat from './RoadmapChat.vue';

export default {
  name: 'RoadmapBase',
  components: {
    RoadmapGrid,
    RoadmapTaskForm,      // 別名で登録
    RoadmapTaskEdit, // 別名で登録
    RoadmapChat
  },
  data() {
    return {
      tasks: [], // ロードマップのタスクデータ
      showEditModal: false,
      editingTask: null, // 編集中のタスクデータ
      currentEditedCategoryName: 'デフォルトカテゴリ名', // RoadmapGridに渡すカテゴリ名
      nextTaskId: 1 // タスクIDの自動採番用
    };
  },
  methods: {
    handleAddTask(newTaskData) {
      const newTask = {
        id: this.nextTaskId++, // IDを付与
        ...newTaskData,
        status: '未開始' // 初期ステータス
      };
      this.tasks.push(newTask);
      console.log('タスクが追加されました:', newTask);
    },
    handleEditTask(taskId) {
      this.editingTask = this.tasks.find(task => task.id === taskId);
      if (this.editingTask) {
        this.showEditModal = true;
      }
    },
    handleSaveTask(updatedTask) {
      const index = this.tasks.findIndex(task => task.id === updatedTask.id);
      if (index !== -1) {
        this.tasks.splice(index, 1, updatedTask);
      }
      this.showEditModal = false;
      this.editingTask = null;
      console.log('タスクが保存されました:', updatedTask);
    },
    handleDeleteTask(taskId) {
      this.tasks = this.tasks.filter(task => task.id !== taskId);
      console.log(`タスクID: ${taskId} が削除されました。`);
    },
    handleFinishCategoryEdit(rowIndex, newCategoryName) {
      // ここで categories の配列などを管理している場合、そのカテゴリ名を更新するロジック
      // 例: this.categories[rowIndex].name = newCategoryName;
      console.log(`カテゴリ ${rowIndex} が ${newCategoryName} に更新されました。`);
      this.currentEditedCategoryName = newCategoryName; // 自身の状態も更新
    }
  }
}
</script>

<style scoped>
.roadmap-base-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

h2 {
  color: #333;
  margin-bottom: 30px;
}
</style>