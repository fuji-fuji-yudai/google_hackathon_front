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
import RoadmapTaskEditModal from './RoadmapTaskEditModal.vue';

const props = defineProps({
  roadmapData: { type: Array, required: true },
  allMonths: { type: Array, required: true }, // allMonths がここにあることを確認
  allQuarters: { type: Array, required: true },
  initialCategoryColors: { type: Object, default: () => ({}) },
});

const emit = defineEmits([
  'add-task-to-manager',
  'save-task-edit-to-manager',
  'delete-task-to-manager'
]);

// newTask のプロパティ名を startMonth, endMonth に変更
// これらは月番号 (例: 1月=1, 4月=4) を格納する
const newTask = ref({ id: null, name: '', category: '', startMonth: null, endMonth: null });
const selectedCategory = ref('');

const allAvailableCategories = computed(() => {
  const categories = new Set();
  props.roadmapData.forEach(row => {
    if (row.category) categories.add(row.category);
  });
  return Array.from(categories).sort();
});

const handleNewTaskUpdate = (updatedTask) => {
  // `updatedTask` は RoadmapTaskAddForm からの `internalNewTask.value` で、
  // `startMonth` と `endMonth` プロパティ (月番号) を持っている
  newTask.value = updatedTask;
  // console.log('RoadmapBase: newTask updated by form:', newTask.value); // デバッグログ
};

const handleSelectedCategoryUpdate = (updatedCategory) => {
  selectedCategory.value = updatedCategory;
  // console.log('RoadmapBase: selectedCategory updated by form:', selectedCategory.value); // デバッグログ
};

// --- 同一期間・カテゴリのタスク数チェック ---
// この関数は、RoadmapGrid で使用される startIndex/endIndex (配列のインデックス) を基に動作するため、
// addTask や saveTaskEdit から呼び出す際には月番号をインデックスに変換して渡す必要がある。
const checkDuplicateTasks = (category, startMonthIndex, endMonthIndex, currentTaskId = null) => {
  const categoryRow = props.roadmapData.find(row => row.category === category);
  if (!categoryRow || !categoryRow.tasks) return false;

  let count = 0;
  for (const task of categoryRow.tasks) {
    if (currentTaskId && task.id === currentTaskId) continue; // 編集中のタスクは除外
    // ここは表示用のインデックス (0-11) で比較するため、変更なし
    if (task.startIndex === startMonthIndex && task.endIndex === endMonthIndex) {
      count++;
    }
  }
  return count >= 3; // 3つ以上なら true (重複)
};

// --- タスク追加 ---
const addTask = () => {
  // console.log('RoadmapBase: addTask called with newTask:', newTask.value); // デバッグログ
  // console.log('RoadmapBase: DEBUG - newTask.value for validation:', newTask.value.name, newTask.value.category, newTask.value.startMonth, newTask.value.endMonth);

  if (!newTask.value.name?.trim()) { ElMessage.error('タスク名を入力してください。'); return; }
  if (!newTask.value.category?.trim()) { ElMessage.error('カテゴリを選択または入力してください。'); return; }

  // バリデーションのプロパティ名を startMonth, endMonth に変更し、
  // null または空文字列の場合をチェック (空文字列は <option value=""> の選択時に起こりうる)
  if (newTask.value.startMonth === null || newTask.value.startMonth === '' || 
      newTask.value.endMonth === null || newTask.value.endMonth === '') {
    ElMessage.error('開始月と終了月を選択してください。');
    return;
  }
  
  // 月番号 (数値) の比較に変更
  if (newTask.value.startMonth > newTask.value.endMonth) { 
    ElMessage.error('開始月は終了月よりも前に設定してください。'); 
    return; 
  }

  // NOTE: checkDuplicateTasks は startIndex/endIndex (配列インデックス) を使うため、
  // 月番号から対応するインデックスに変換してチェックする
  const startIdx = props.allMonths.findIndex(m => m.monthNumber === newTask.value.startMonth);
  const endIdx = props.allMonths.findIndex(m => m.monthNumber === newTask.value.endMonth);

  if (startIdx === -1 || endIdx === -1) {
      // allMonths に存在しない月番号が選択された場合 (通常は発生しないはず)
      ElMessage.error('選択された開始月または終了月が無効です。');
      return;
  }

  // 変換したインデックスを使用して重複チェック
  if (checkDuplicateTasks(newTask.value.category, startIdx, endIdx)) {
    ElMessage.error('このカテゴリでは、指定された期間にすでに3つのタスクが存在します。');
    return;
  }

  // emit するペイロードを startMonth, endMonth (月番号) に変更
  // RoadmapView (RoadmapManager) がバックエンドに送信する形式に合わせる
  emit('add-task-to-manager', {
    id: null, // 新規追加なのでIDはnull
    name: newTask.value.name,
    category: newTask.value.category,
    startMonth: newTask.value.startMonth, // 月番号
    endMonth: newTask.value.endMonth,     // 月番号
  });

  ElMessage.success('タスク追加のリクエストを送信しました。');
  resetAddTaskForm();
};

const resetAddTaskForm = () => {
  // ★変更点5: リセットするプロパティ名を startMonth, endMonth に変更
  newTask.value = { id: null, name: '', category: '', startMonth: null, endMonth: null };
  selectedCategory.value = '';
};

const isEditModalVisible = ref(false);
const taskToEdit = ref(null);

// --- 編集モーダルを開く ---
const openEditModal = (task) => {
  // RoadmapGrid から渡される task オブジェクトは
  // 表示用の startIndex/endIndex (配列インデックス) を持つ。
  // RoadmapTaskEditModal に渡すために、これらを元の monthNumber (月番号) に変換する。
  const originalStartMonthData = props.allMonths[task.startIndex];
  const originalEndMonthData = props.allMonths[task.endIndex];

  taskToEdit.value = { 
    ...task, 
    // startIndex/endIndex から monthNumber に変換
    startMonth: originalStartMonthData ? originalStartMonthData.monthNumber : null,
    endMonth: originalEndMonthData ? originalEndMonthData.monthNumber : null,
    // 必要であれば originalStartMonthData.year などを startYear/endYear として渡すことも可能
    startYear: originalStartMonthData ? originalStartMonthData.year : null,
    endYear: originalEndMonthData ? originalEndMonthData.year : null,
  };
  isEditModalVisible.value = true;
  // console.log('RoadmapBase: openEditModal with task (converted):', taskToEdit.value); // デバッグログ
};

// --- タスク編集保存 ---
const saveTaskEdit = (updatedTask) => {
  // console.log('RoadmapBase: saveTaskEdit called with updatedTask:', updatedTask); // デバッグログ

  if (!updatedTask.name?.trim()) { ElMessage.error('タスク名を入力してください。'); return; }
  if (!updatedTask.category?.trim()) { ElMessage.error('カテゴリを選択してください。'); return; }

  // バリデーションのプロパティ名を startMonth, endMonth に変更
  if (updatedTask.startMonth === null || updatedTask.startMonth === '' || 
      updatedTask.endMonth === null || updatedTask.endMonth === '') { 
    ElMessage.error('開始月と終了月を選択してください。'); 
    return; 
  }
  // 月番号 (数値) の比較に変更
  if (updatedTask.startMonth > updatedTask.endMonth) { 
    ElMessage.error('開始月は終了月よりも前に設定してください。'); 
    return; 
  }

  // NOTE: checkDuplicateTasks は startIndex/endIndex (配列インデックス) を使うため、
  // 月番号から対応するインデックスに変換してチェックする
  const startIdx = props.allMonths.findIndex(m => m.monthNumber === updatedTask.startMonth);
  const endIdx = props.allMonths.findIndex(m => m.monthNumber === updatedTask.endMonth);

  if (startIdx === -1 || endIdx === -1) {
      ElMessage.error('選択された開始月または終了月が無効です。');
      return;
  }
  
  // 変換したインデックスを使用して重複チェック
  if (checkDuplicateTasks(updatedTask.category, startIdx, endIdx, updatedTask.id)) {
    ElMessage.error('このカテゴリでは、指定された期間にすでに3つのタスクが存在します。');
    return;
  }

  // emit するペイロードを startMonth, endMonth (月番号) に変更
  // RoadmapView (RoadmapManager) がバックエンドに送信する形式に合わせる
  emit('save-task-edit-to-manager', {
    id: updatedTask.id,
    name: updatedTask.name,
    category: updatedTask.category,
    startMonth: updatedTask.startMonth, // 月番号
    endMonth: updatedTask.endMonth,     // 月番号
  });

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