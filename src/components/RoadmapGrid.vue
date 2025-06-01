<template>
  <div class="roadmap-grid">
    <h3>タスクグリッド</h3>
    <div class="grid-header">
      <div class="grid-cell category-cell">カテゴリ</div>
      <div class="grid-cell">タスク名</div>
      <div class="grid-cell">担当者</div>
      <div class="grid-cell">期限</div>
      <div class="grid-cell">ステータス</div>
      <div class="grid-cell">操作</div>
    </div>

    <div v-for="(task, rowIndex) in tasks" :key="task.id" class="grid-row">
      <div class="grid-cell category-cell" @dblclick="startCategoryEdit(rowIndex)">
        <template v-if="editingCategoryIndex === rowIndex">
          <input
            :value="editedCategoryName" @input="$emit('update:editedCategoryName', $event.target.value)" @blur="$emit('finish-category-edit', rowIndex, $event.target.value)"
            @keyup.enter="$emit('finish-category-edit', rowIndex, $event.target.value)"
          />
        </template>
        <template v-else>
          {{ task.category || '未分類' }}
        </template>
      </div>
      <div class="grid-cell">{{ task.name }}</div>
      <div class="grid-cell">{{ task.assignee }}</div>
      <div class="grid-cell">{{ task.dueDate }}</div>
      <div class="grid-cell">{{ task.status }}</div>
      <div class="grid-cell action-buttons">
        <button @click="$emit('edit-task', task.id)">編集</button>
        <button @click="$emit('delete-task', task.id)">削除</button>
      </div>
    </div>

    <p v-if="tasks.length === 0" class="no-tasks">タスクがありません。</p>
  </div>
</template>

<script>
export default {
  name: 'RoadmapGrid',
  props: {
    tasks: {
      type: Array,
      required: true
    },
    editedCategoryName: { // 親から受け取る編集中のカテゴリ名
      type: String,
      default: ''
    }
  },
  data() {
    return {
      editingCategoryIndex: null // 編集中のカテゴリ行のインデックス
    };
  },
  methods: {
    startCategoryEdit(rowIndex) {
      this.editingCategoryIndex = rowIndex;
      // ここで親から受け取った editedCategoryName を初期値として使う
      // 親コンポーネントが適切な値を渡す責任を持つ
    }
  }
};
</script>

<style scoped>
.roadmap-grid {
  margin-top: 30px;
  border: 1px solid #ddd;
  border-radius: 5px;
  overflow: hidden;
}

h3 {
  background-color: #f4f4f4;
  padding: 10px;
  margin: 0;
  border-bottom: 1px solid #ddd;
}

.grid-header, .grid-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 1fr 1fr 1.2fr; /* カラムの比率を調整 */
  border-bottom: 1px solid #eee;
}

.grid-header {
  background-color: #f9f9f9;
  font-weight: bold;
}

.grid-cell {
  padding: 10px;
  text-align: center;
  border-right: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-cell:last-child {
  border-right: none;
}

.category-cell {
  background-color: #e6f7ff; /* カテゴリセルの背景色 */
}

.category-cell input {
  width: 90%;
  padding: 5px;
  border: 1px solid #007bff;
  border-radius: 3px;
}

.action-buttons button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin: 0 5px;
  transition: background-color 0.2s;
}

.action-buttons button:hover {
  background-color: #0056b3;
}

.action-buttons button:last-child {
  background-color: #dc3545;
}

.action-buttons button:last-child:hover {
  background-color: #c82333;
}

.no-tasks {
  text-align: center;
  padding: 20px;
  color: #888;
}
</style>