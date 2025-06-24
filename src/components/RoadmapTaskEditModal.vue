<template>
  <el-dialog
    v-model="internalIsVisible"
    title="タスクを編集"
    width="500px"
    :before-close="handleClose"
  >
    <div class="edit-form-content">
      <div class="form-group">
        <label for="edit-category-select">カテゴリ:</label>
        <select id="edit-category-select" v-model="internalTask.category" class="input-field">
          <option v-for="category in allAvailableCategories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="edit-task-name">タスク名:</label>
        <input
          id="edit-task-name"
          type="text"
          v-model="internalTask.name"
          placeholder="タスク名を入力してください"
          class="input-field"
        />
      </div>

      <div class="form-group month-selection">
        <div class="month-select-item">
          <label for="edit-start-month">開始月:</label>
          <select id="edit-start-month" v-model.number="internalTask.startMonth" class="input-field">
            <option value="" disabled>-- 選択 --</option>
            <option v-for="month in months" :key="month.id" :value="month.monthNumber">
              {{ month.name }} ({{ month.year }})
            </option>
          </select>
        </div>
        <div class="month-select-item">
          <label for="edit-end-month">終了月:</label>
          <select id="edit-end-month" v-model.number="internalTask.endMonth" class="input-field">
            <option value="" disabled>-- 選択 --</option>
            <option v-for="month in months" :key="month.id" :value="month.monthNumber">
              {{ month.name }} ({{ month.year }})
            </option>
          </select>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleDelete">削除</el-button>
        <el-button @click="handleClose">キャンセル</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  taskToEdit: {
    type: Object,
    default: null,
    // taskToEdit のプロパティとして startMonth と endMonth (月番号) が渡されることを想定
    // { id: ..., name: ..., category: ..., startMonth: num, endMonth: num, startIndex: num, endIndex: num }
  },
  allAvailableCategories: {
    type: Array,
    default: () => [],
  },
  months: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['update:isVisible', 'save-task-edit', 'delete-task']);

const internalIsVisible = ref(props.isVisible);
// internalTask の初期化。taskToEdit のプロパティ名に合わせる
const internalTask = ref({});
const originalCategory = ref(''); // カテゴリ変更を検出するために元のカテゴリを保存

watch(() => props.isVisible, (newVal) => {
  internalIsVisible.value = newVal;
});

// taskToEdit の変更を internalTask に同期
watch(() => props.taskToEdit, (newVal) => {
  if (newVal) {
    // newVal には startMonth と endMonth (月番号) が含まれることを想定
    internalTask.value = { ...newVal };
    originalCategory.value = newVal.category; // 元のカテゴリを保存
  }
}, { deep: true, immediate: true }); // immediate: true で初期ロード時にもwatchが発火

const handleSave = () => {
  if (!internalTask.value.name?.trim()) { // .trim() を追加して空文字もチェック
    ElMessage.error('タスク名を入力してください。');
    return;
  }
  if (!internalTask.value.category?.trim()) { // .trim() を追加して空文字もチェック
    ElMessage.error('カテゴリを選択してください。');
    return;
  }
  //バリデーションを internalTask.startMonth と internalTask.endMonth に変更
  // null または空文字列の場合をチェック (<option value=""> が選択された場合も考慮)
  if (internalTask.value.startMonth === null || internalTask.value.startMonth === '' || 
      internalTask.value.endMonth === null || internalTask.value.endMonth === '') {
    ElMessage.error('開始月と終了月を選択してください。');
    return;
  }
  //月番号の比較に変更
  if (internalTask.value.startMonth > internalTask.value.endMonth) {
    ElMessage.error('開始月は終了月よりも前に設定してください。');
    return;
  }

  // 編集されたタスクデータを親にemit
  // emit するペイロードを startMonth, endMonth (月番号) に変更
  // RoadmapBase が期待する形式に合わせる
  emit('save-task-edit', { 
    id: internalTask.value.id, // IDは必須
    name: internalTask.value.name,
    category: internalTask.value.category,
    startMonth: internalTask.value.startMonth, // 月番号
    endMonth: internalTask.value.endMonth,     // 月番号
    originalCategory: originalCategory.value // カテゴリ変更を検出するために渡す
  });
  internalIsVisible.value = false;
};

const handleDelete = () => {
  if (internalTask.value && internalTask.value.id) {
    emit('delete-task', internalTask.value.id);
  } else {
    ElMessage.error('削除対象のタスクが見つかりませんでした。');
  }
};

const handleClose = () => {
  emit('update:isVisible', false);
};
</script>

<style scoped>
.edit-form-content {
  padding: 10px 0; /* パディングを少し減らす */
}

.form-group {
  margin-bottom: 15px; /* グループ間のマージン */
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.input-field {
  width: 100%;
  padding: 8px 10px; /* パディングを調整 */
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 0.95em;
}

.input-field:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
  outline: none;
}

.month-selection {
  display: flex;
  gap: 10px; /* 月選択のアイテム間のギャップ */
}

.month-select-item {
  flex: 1; /* 均等な幅 */
}

.dialog-footer {
  display: flex;
  justify-content: flex-end; /* ボタンを右寄せ */
  gap: 10px; /* ボタン間のスペース */
}
</style>