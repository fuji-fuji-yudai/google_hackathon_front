<template>
  <div v-if="editingTask" class="modal-overlay">
    <div class="modal-content">
      <h2>タスクを編集</h2>
      <div class="form-grid">
        <div class="form-row">
          <label for="edit-task-name">タスク名:</label>
          <input
            type="text"
            id="edit-task-name"
            v-model="localEditingTask.name"
            class="small-input"
          />
        </div>
        <div class="form-row">
          <label for="edit-start-month">開始月:</label>
          <select
            id="edit-start-month"
            v-model="localEditingTask.startIndex"
            class="small-input"
          >
            <option
              v-for="(month, index) in months"
              :key="month.id"
              :value="index"
            >
              {{ month.name }}
            </option>
          </select>
        </div>
        <div class="form-row">
          <label for="edit-end-month">終了月:</label>
          <select
            id="edit-end-month"
            v-model="localEditingTask.endIndex"
            class="small-input"
          >
            <option
              v-for="(month, index) in months"
              :key="month.id"
              :value="index"
            >
              {{ month.name }}
            </option>
          </select>
        </div>
      </div>
      <div class="modal-actions">
        <button @click="saveTask" class="small-button">保存</button>
        <button @click="cancelEdit" class="small-button secondary">キャンセル</button>
        <button @click="deleteTask" class="small-button delete">削除</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoadmapTaskEditModal',
  props: {
    editingTask: {
      type: Object,
      default: null,
    },
    months: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      localEditingTask: this.editingTask ? { ...this.editingTask } : null,
    };
  },
  watch: {
    editingTask(newVal) {
      // propsが更新されたときにローカルデータを同期
      this.localEditingTask = newVal ? { ...newVal } : null;
    },
  },
  methods: {
    saveTask() {
      // 親に変更を通知
      this.$emit('update:editingTask', this.localEditingTask); // 親のeditingTaskを更新
      this.$emit('save-task-edit'); // 保存処理をトリガー
    },
    cancelEdit() {
      this.$emit('cancel-task-edit');
    },
    deleteTask() {
      this.$emit('delete-task');
    },
  },
};
</script>

<style scoped>
.modal-overlay {
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

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  text-align: center;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 25px;
  color: #333;
  font-size: 1.6em;
}

.modal-content .form-grid {
  grid-template-columns: 1fr;
  max-width: 100%;
  margin-bottom: 25px;
}

.modal-content .form-row label {
  text-align: left;
  width: 100px;
}

.modal-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 20px;
}

.small-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  display: block;
  margin: 0 10px 0 0; /* 右側にマージンを追加 */
  font-weight: bold;
  letter-spacing: 0.5px;
}
.small-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.small-button.secondary {
  background-color: #6c757d;
  margin-left: 10px; /* 左側にマージンを追加 */
}
.small-button.secondary:hover {
  background-color: #5a6268;
}

.small-button.delete {
  background-color: #dc3545;
  margin-left: auto; /* 右端に寄せる */
}
.small-button.delete:hover {
  background-color: #c82333;
}
</style>