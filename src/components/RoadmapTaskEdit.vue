<template>
  <div class="modal-overlay" @click.self="cancelEdit">
    <div class="modal-content">
      <h2>タスクを編集</h2>
      <div class="form-grid">
        <div class="form-row">
          <label for="editTaskName">タスク名:</label>
          <input v-model="localTask.name" id="editTaskName" type="text" class="small-input">
        </div>
        <div class="form-row">
          <label for="editStartMonth">開始月:</label>
          <select v-model="localTask.startIndex" id="editStartMonth" class="small-input">
            <option v-for="(m, index) in months" :key="m.id" :value="index">{{ m.name }}</option>
          </select>
        </div>
        <div class="form-row">
          <label for="editEndMonth">終了月:</label>
          <select v-model="localTask.endIndex" id="editEndMonth" class="small-input">
            <option v-for="(m, index) in months" :key="m.id" :value="index">{{ m.name }}</option>
          </select>
        </div>
      </div>
      <div class="modal-actions">
        <button @click="saveEdit" class="small-button">保存</button>
        <button @click="cancelEdit" class="small-button secondary">キャンセル</button>
        <button @click="deleteTask" class="small-button delete">削除</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoadmapTaskEdit',
  props: {
    editingTask: {
      type: Object,
      required: true
    },
    months: {
      type: Array,
      required: true
    }
  },
  emits: ['save', 'cancel', 'delete'],
  data() {
    return {
      localTask: { ...this.editingTask } // propsを直接変更しないようにローカルコピーを作成
    };
  },
  watch: {
    editingTask: {
      handler(newTask) {
        this.localTask = { ...newTask }; // editingTaskが変更されたらローカルコピーを更新
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    saveEdit() {
      if (!this.localTask.name) {
        alert('タスク名は必須です。');
        return;
      }
      if (this.localTask.startIndex > this.localTask.endIndex) {
        alert('開始月は終了月より前に設定してください。');
        return;
      }
      this.$emit('save', this.localTask);
    },
    cancelEdit() {
      this.$emit('cancel');
    },
    deleteTask() {
      if (confirm('このタスクを削除してもよろしいですか？')) {
        this.$emit('delete', this.localTask.id);
      }
    }
  }
};
</script>

<style scoped>
/* モーダルオーバーレイ */
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

/* フォーム共通スタイル */
.form-grid {
  display: grid;
  gap: 15px;
}
.form-row {
  display: flex;
  align-items: center;
}
.form-row label {
  width: 100px; /* Adjust as needed */
  text-align: right;
  margin-right: 15px;
  font-weight: bold;
  color: #555;
  font-size: 0.95em;
}
.small-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 0.9em;
  box-sizing: border-box;
  background-color: #fdfdfd;
  color: #333;
}
.small-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  outline: none;
}

/* ボタン共通スタイル */
.small-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  font-weight: bold;
  letter-spacing: 0.5px;
}
.small-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}
.small-button.secondary {
  background-color: #6c757d;
  margin-left: 10px;
}
.small-button.secondary:hover {
  background-color: #5a6268;
}
.small-button.delete {
  background-color: #dc3545;
  margin-left: auto;
}
.small-button.delete:hover {
  background-color: #c82333;
}
</style>    