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
        <label for="edit-task-name">目標:</label>
        <input
          id="edit-task-name"
          type="text"
          v-model="internalTask.name"
          placeholder="目標を入力してください"
          class="input-field"
        />
      </div>

      <div class="form-group month-selection">
        <div class="month-select-item">
          <label for="edit-start-year">開始年:</label> <select id="edit-start-year" v-model.number="internalTask.startYear" class="input-field">
            <option value="" disabled>-- 選択 --</option>
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}年
            </option>
          </select>
        </div>
        <div class="month-select-item">
          <label for="edit-start-month">開始月:</label>
          <select id="edit-start-month" v-model.number="internalTask.startMonth" class="input-field">
            <option value="" disabled>-- 選択 --</option>
            <option v-for="month in filteredMonths(internalTask.startYear)" :key="month.id" :value="month.monthNumber">
              {{ month.name }} ({{ month.year }})
            </option>
          </select>
        </div>
      </div>
      
      <div class="form-group month-selection">
        <div class="month-select-item">
          <label for="edit-end-year">終了年:</label> <select id="edit-end-year" v-model.number="internalTask.endYear" class="input-field">
            <option value="" disabled>-- 選択 --</option>
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}年
            </option>
          </select>
        </div>
        <div class="month-select-item">
          <label for="edit-end-month">終了月:</label>
          <select id="edit-end-month" v-model.number="internalTask.endMonth" class="input-field">
            <option value="" disabled>-- 選択 --</option>
            <option v-for="month in filteredMonths(internalTask.endYear)" :key="month.id" :value="month.monthNumber">
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
import { ref, watch, computed } from 'vue'; // computed を追加
import { ElMessage } from 'element-plus';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  taskToEdit: {
    type: Object,
    default: null,
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
const internalTask = ref({});
const originalCategory = ref('');

// months prop から利用可能な年を抽出する computed プロパティ
const availableYears = computed(() => {
  const years = new Set();
  props.months.forEach(month => {
    years.add(month.year);
  });
  return Array.from(years).sort((a, b) => a - b);
});

// 選択された年に応じて月をフィルタリングする関数
const filteredMonths = (selectedYear) => {
  if (!selectedYear) {
    return props.months; // 年が選択されていなければ全ての月を返す
  }
  return props.months.filter(month => month.year === selectedYear);
};

watch(() => props.isVisible, (newVal) => {
  internalIsVisible.value = newVal;
});

watch(() => props.taskToEdit, (newVal) => {
  if (newVal) {
    // newVal に startMonth, endMonth (月番号), startYear, endYear (年) が含まれることを想定
    internalTask.value = { ...newVal };
    originalCategory.value = newVal.category;
  }
}, { deep: true, immediate: true });

const handleSave = () => {
  if (!internalTask.value.name?.trim()) {
    ElMessage.error('目標を入力してください。');
    return;
  }
  if (!internalTask.value.category?.trim()) {
    ElMessage.error('カテゴリを選択してください。');
    return;
  }

  // 年のバリデーションを追加
  if (internalTask.value.startYear === null || internalTask.value.startYear === '' ||
      internalTask.value.endYear === null || internalTask.value.endYear === '') {
    ElMessage.error('開始年と終了年を選択してください。');
    return;
  }
  // 月のバリデーションはそのまま
  if (internalTask.value.startMonth === null || internalTask.value.startMonth === '' || 
      internalTask.value.endMonth === null || internalTask.value.endMonth === '') {
    ElMessage.error('開始月と終了月を選択してください。');
    return;
  }

  // 年と月の組み合わせで期間を比較
  const startDate = new Date(internalTask.value.startYear, internalTask.value.startMonth - 1); // 月は0-indexed
  const endDate = new Date(internalTask.value.endYear, internalTask.value.endMonth - 1);

  if (startDate > endDate) {
    ElMessage.error('開始日は終了日よりも前に設定してください。');
    return;
  }

  // 編集されたタスクデータを親にemit
  // startYear, endYear も含めて渡す
  emit('save-task-edit', { 
    id: internalTask.value.id,
    name: internalTask.value.name,
    category: internalTask.value.category,
    startMonth: internalTask.value.startMonth,
    endMonth: internalTask.value.endMonth,
    startYear: internalTask.value.startYear, 
    endYear: internalTask.value.endYear,     
    originalCategory: originalCategory.value
  });
  internalIsVisible.value = false;
};

const handleDelete = () => {
  if (internalTask.value && internalTask.value.id) {
    emit('delete-task', internalTask.value.id);
  } else {
    ElMessage.error('削除対象の目標が見つかりませんでした。');
  }
};

const handleClose = () => {
  emit('update:isVisible', false);
};
</script>

<style scoped>
.edit-form-content {
  padding: 10px 0;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.input-field {
  width: 100%;
  padding: 8px 10px;
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
  gap: 10px;
  /* 年と月のペアが同じ行に並ぶように調整 */
  flex-wrap: wrap; /* 小さな画面で折り返す */
}

.month-select-item {
  flex: 1; /* 均等な幅 */
  min-width: 48%; /* 2つ並べるために調整 */
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>