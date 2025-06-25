<template>
  <div class="roadmap-container">
    <RoadmapGrid
      :roadmap-data="props.roadmapData"
      :all-months="props.allMonths"
      :all-quarters="props.allQuarters"
      :initial-category-colors="props.initialCategoryColors"
      @start-task-edit="openEditModal"
    />

    <RoadmapTaskAddForm
      :new-task="newTask"
      :selected-category="selectedCategory"
      :all-available-categories="allAvailableCategories"
      :months="props.allMonths"
      @update:newTask="handleNewTaskUpdate"
      @update:selectedCategory="handleSelectedCategoryUpdate"
      @add-task="addTask"
    />

    <RoadmapTaskEditModal
      :is-visible="isEditModalVisible"
      :task-to-edit="taskToEdit"
      :all-available-categories="allAvailableCategories"
      :months="props.allMonths"
      @update:isVisible="isEditModalVisible = $event"
      @save-task-edit="saveTaskEdit"
      @delete-task="deleteTask"
    />
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import RoadmapGrid from './RoadmapGrid.vue';
import RoadmapTaskAddForm from './RoadmapTaskAddForm.vue';
import RoadmapTaskEditModal from './RoadmapTaskEditModal.vue';

const props = defineProps({
  roadmapData: { type: Array, required: true },
  allMonths: { type: Array, required: true },
  allQuarters: { type: Array, required: true },
  initialCategoryColors: { type: Object, default: () => ({}) },
});

const emit = defineEmits([
  'add-task-to-manager',
  'save-task-edit-to-manager',
  'delete-task-to-manager'
]);

const newTask = ref({ id: null, name: '', category: '', startMonth: null, endMonth: null, startYear: null, endYear: null });
const selectedCategory = ref('');

const allAvailableCategories = computed(() => {
  const categories = new Set();
  props.roadmapData.forEach(row => {
    if (row.category) categories.add(row.category);
  });
  return Array.from(categories).sort();
});

const handleNewTaskUpdate = (updatedTask) => {
  newTask.value = updatedTask;
};

const handleSelectedCategoryUpdate = (updatedCategory) => {
  selectedCategory.value = updatedCategory;
};

const checkDuplicateTasks = (category, startMonthData, endMonthData, currentTaskId = null) => {
  const categoryRow = props.roadmapData.find(row => row.category === category);
  if (!categoryRow || !categoryRow.tasks) return false;

  let count = 0;
  for (const task of categoryRow.tasks) {
    if (currentTaskId && task.id === currentTaskId) continue;

    // タスクの startIndex と endIndex は allMonths のインデックス
    const taskStartMonthData = props.allMonths[task.startIndex];
    const taskEndMonthData = props.allMonths[task.endIndex];

    // 新しいタスクの期間と既存タスクの期間が完全に一致するかをチェック
    // 月番号と年の両方で比較
    if (taskStartMonthData && taskEndMonthData &&
        taskStartMonthData.monthNumber === startMonthData.monthNumber &&
        taskStartMonthData.year === startMonthData.year &&
        taskEndMonthData.monthNumber === endMonthData.monthNumber &&
        taskEndMonthData.year === endMonthData.year) {
      count++;
    }
  }
  return count >= 3;
};

const addTask = () => {
  if (!newTask.value.name?.trim()) { ElMessage.error('タスク名を入力してください。'); return; }
  if (!newTask.value.category?.trim()) { ElMessage.error('カテゴリを選択または入力してください。'); return; }

  // startMonth/endMonth と startYear/endYear のバリデーション
  if (newTask.value.startMonth === null || newTask.value.startMonth === '' || 
      newTask.value.endMonth === null || newTask.value.endMonth === '' ||
      newTask.value.startYear === null || newTask.value.startYear === '' ||
      newTask.value.endYear === null || newTask.value.endYear === '') {
    ElMessage.error('開始年月と終了年月を選択してください。');
    return;
  }
  
  // 年と月を結合して比較しやすい形式に変換 (YYYYMM)
  const startCombined = parseInt(`${newTask.value.startYear}${String(newTask.value.startMonth).padStart(2, '0')}`);
  const endCombined = parseInt(`${newTask.value.endYear}${String(newTask.value.endMonth).padStart(2, '0')}`);

  if (startCombined > endCombined) {
    ElMessage.error('開始年月は終了年月よりも前に設定してください。');
    return;
  }

  const startMonthData = props.allMonths.find(m => m.monthNumber === newTask.value.startMonth && m.year === newTask.value.startYear);
  const endMonthData = props.allMonths.find(m => m.monthNumber === newTask.value.endMonth && m.year === newTask.value.endYear);

  if (!startMonthData || !endMonthData) {
    ElMessage.error('選択された開始年月または終了年月が無効です。ロードマップの期間外の可能性があります。');
    return;
  }

  if (checkDuplicateTasks(newTask.value.category, startMonthData, endMonthData)) {
    ElMessage.error('このカテゴリでは、指定された期間にすでに3つのタスクが存在します。');
    return;
  }

  emit('add-task-to-manager', {
    id: null,
    name: newTask.value.name,
    category: newTask.value.category,
    startMonth: newTask.value.startMonth,
    endMonth: newTask.value.endMonth,
    startYear: newTask.value.startYear,
    endYear: newTask.value.endYear,
  });

  ElMessage.success('タスク追加のリクエストを送信しました。');
  resetAddTaskForm();
};

const resetAddTaskForm = () => {
  newTask.value = { id: null, name: '', category: '', startMonth: null, endMonth: null, startYear: null, endYear: null };
  selectedCategory.value = '';
};

const isEditModalVisible = ref(false);
const taskToEdit = ref(null);

const openEditModal = (task) => {
  const originalStartMonthData = props.allMonths[task.startIndex];
  const originalEndMonthData = props.allMonths[task.endIndex];

  taskToEdit.value = { 
    ...task, 
    startMonth: originalStartMonthData ? originalStartMonthData.monthNumber : null,
    endMonth: originalEndMonthData ? originalEndMonthData.monthNumber : null,
    startYear: originalStartMonthData ? originalStartMonthData.year : null,
    endYear: originalEndMonthData ? originalEndMonthData.year : null,
  };
  isEditModalVisible.value = true;
};

const saveTaskEdit = (updatedTask) => {
  if (!updatedTask.name?.trim()) { ElMessage.error('タスク名を入力してください。'); return; }
  if (!updatedTask.category?.trim()) { ElMessage.error('カテゴリを選択してください。'); return; }

  if (updatedTask.startMonth === null || updatedTask.startMonth === '' || 
      updatedTask.endMonth === null || updatedTask.endMonth === '' ||
      updatedTask.startYear === null || updatedTask.startYear === '' ||
      updatedTask.endYear === null || updatedTask.endYear === '') {
    ElMessage.error('開始年月と終了年月を選択してください。');
    return;
  }

  const startCombined = parseInt(`${updatedTask.startYear}${String(updatedTask.startMonth).padStart(2, '0')}`);
  const endCombined = parseInt(`${updatedTask.endYear}${String(updatedTask.endMonth).padStart(2, '0')}`);

  if (startCombined > endCombined) {
    ElMessage.error('開始年月は終了年月よりも前に設定してください。');
    return;
  }

  const startMonthData = props.allMonths.find(m => m.monthNumber === updatedTask.startMonth && m.year === updatedTask.startYear);
  const endMonthData = props.allMonths.find(m => m.monthNumber === updatedTask.endMonth && m.year === updatedTask.endYear);

  if (!startMonthData || !endMonthData) {
    ElMessage.error('選択された開始年月または終了年月が無効です。ロードマップの期間外の可能性があります。');
    return;
  }
  
  if (checkDuplicateTasks(updatedTask.category, startMonthData, endMonthData, updatedTask.id)) {
    ElMessage.error('このカテゴリでは、指定された期間にすでに3つのタスクが存在します。');
    return;
  }

  emit('save-task-edit-to-manager', {
    id: updatedTask.id,
    name: updatedTask.name,
    category: updatedTask.category,
    startMonth: updatedTask.startMonth,
    endMonth: updatedTask.endMonth,
    startYear: updatedTask.startYear,
    endYear: updatedTask.endYear,
  });

  ElMessage.success('タスク更新のリクエストを送信しました。');
  isEditModalVisible.value = false;
  taskToEdit.value = null;
};

const deleteTask = async (taskIdToDelete) => {
  try {
    await ElMessageBox.confirm('このタスクを本当に削除しますか？', 'タスク削除の確認', {
      confirmButtonText: '削除',
      cancelButtonText: 'キャンセル',
      type: 'warning',
    });

    emit('delete-task-to-manager', taskIdToDelete);

    ElMessage.success('タスク削除のリクエストを送信しました。');
    isEditModalVisible.value = false;
    taskToEdit.value = null;
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('タスクの削除中にエラーが発生しました。');
    } else {
      ElMessage.info('タスクの削除がキャンセルされました。');
    }
  }
};
</script>

<style scoped>
.roadmap-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: none;
  border: none;
  background-color: transparent; /* 背景も透明に */
}
</style>