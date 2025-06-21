<template>
  <div class="roadmap-container">
    <RoadmapGrid
      :roadmap-data="props.roadmapData"
      :all-months="allMonths"
      :all-quarters="allQuarters"
      :initial-category-colors="initialCategoryColors"
      @start-task-edit="openEditModal"
    />

    <RoadmapTaskAddForm
      :new-task="newTask"
      :selected-category="selectedCategory"
      :all-available-categories="allAvailableCategories"
      :months="allMonths"
      @update:newTask="handleNewTaskUpdate"
      @update:selectedCategory="handleSelectedCategoryUpdate"
      @add-task="addTask"
    />

    <RoadmapTaskEditModal
      :is-visible="isEditModalVisible"
      :task-to-edit="taskToEdit"
      :all-available-categories="allAvailableCategories"
      :months="allMonths"
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
import RoadmapTaskEditModal from './RoadmapTaskEditModal.vue'; // ★重要: 拡張子が .Lvu の場合は .vue に修正してください

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

const newTask = ref({ id: null, name: '', category: '', startMonthIndex: null, endMonthIndex: null });
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
  // console.log('RoadmapBase: newTask updated by form:', newTask.value); // デバッグログ
};
const handleSelectedCategoryUpdate = (updatedCategory) => {
  selectedCategory.value = updatedCategory;
  // console.log('RoadmapBase: selectedCategory updated by form:', selectedCategory.value); // デバッグログ
};

// --- 同一期間・カテゴリのタスク数チェック ---
const checkDuplicateTasks = (category, startMonthIndex, endMonthIndex, currentTaskId = null) => {
  const categoryRow = props.roadmapData.find(row => row.category === category);
  if (!categoryRow || !categoryRow.tasks) return false;

  let count = 0;
  for (const task of categoryRow.tasks) {
    if (currentTaskId && task.id === currentTaskId) continue; // 編集中のタスクは除外
    if (task.startIndex === startMonthIndex && task.endIndex === endMonthIndex) {
      count++;
    }
  }
  return count >= 3; // 3つ以上なら true (重複)
};

// --- タスク追加 ---
const addTask = () => {
  // console.log('RoadmapBase: addTask called with newTask:', newTask.value); // デバッグログ

  if (!newTask.value.name?.trim()) { ElMessage.error('タスク名を入力してください。'); return; }
  if (!newTask.value.category?.trim()) { ElMessage.error('カテゴリを選択または入力してください。'); return; }
  if (newTask.value.startMonthIndex === null || newTask.value.endMonthIndex === null) { ElMessage.error('開始月と終了月を選択してください。'); return; }
  if (newTask.value.startMonthIndex > newTask.value.endMonthIndex) { ElMessage.error('開始月は終了月よりも前に設定してください。'); return; }

  if (checkDuplicateTasks(newTask.value.category, newTask.value.startMonthIndex, newTask.value.endMonthIndex)) {
    ElMessage.error('このカテゴリでは、指定された期間にすでに3つのタスクが存在します。');
    return;
  }

  emit('add-task-to-manager', {
    id: null,
    name: newTask.value.name,
    category: newTask.value.category,
    startMonthIndex: newTask.value.startMonthIndex,
    endMonthIndex: newTask.value.endMonthIndex,
  });

  ElMessage.success('タスク追加のリクエストを送信しました。');
  resetAddTaskForm();
};

const resetAddTaskForm = () => {
  newTask.value = { id: null, name: '', category: '', startMonthIndex: null, endMonthIndex: null };
  selectedCategory.value = '';
};

const isEditModalVisible = ref(false);
const taskToEdit = ref(null);

// --- 編集モーダルを開く ---
const openEditModal = (task) => {
  taskToEdit.value = { ...task }; 
  isEditModalVisible.value = true;
  // console.log('RoadmapBase: openEditModal with task:', taskToEdit.value); // デバッグログ
};

// --- タスク編集保存 ---
const saveTaskEdit = (updatedTask) => {
  // console.log('RoadmapBase: saveTaskEdit called with updatedTask:', updatedTask); // デバッグログ

  if (!updatedTask.name?.trim()) { ElMessage.error('タスク名を入力してください。'); return; }
  if (!updatedTask.category?.trim()) { ElMessage.error('カテゴリを選択してください。'); return; }
  if (updatedTask.startMonthIndex === null || updatedTask.endMonthIndex === null) { ElMessage.error('開始月と終了月を選択してください。'); return; }
  if (updatedTask.startMonthIndex > updatedTask.endMonthIndex) { ElMessage.error('開始月は終了月よりも前に設定してください。'); return; }

  if (checkDuplicateTasks(updatedTask.category, updatedTask.startMonthIndex, updatedTask.endMonthIndex, updatedTask.id)) {
    ElMessage.error('このカテゴリでは、指定された期間にすでに3つのタスクが存在します。');
    return;
  }

  emit('save-task-edit-to-manager', updatedTask);

  ElMessage.success('タスク更新のリクエストを送信しました。');
  isEditModalVisible.value = false;
  taskToEdit.value = null;
};

// --- タスク削除 ---
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
      // console.error('Task deletion error:', error); // デバッグログ
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
}
</style>