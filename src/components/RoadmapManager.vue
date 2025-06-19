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
      <button class="save-roadmap-button" @click="saveRoadmapData" v-if="false">
        データ保存 (自動保存有効中)
      </button>
    </div>

    <p v-if="loading" class="loading-message">ロードマップデータを読み込み中...</p>
    <p v-if="apiError" class="error-message">エラー: {{ apiError }}</p>
    <p v-if="!jwtToken && !loading" class="warning-message">
      ロードマップの表示はできますが、変更を保存するにはログインが必要です。
    </p>

    <RoadmapBase
      :roadmap-data="roadmapData"
      :all-months="allMonths"
      :all-quarters="allQuarters"
      :initial-category-colors="categoryColors"
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
        <ReminderView /> <button class="close-button" @click="closeReminderModal">閉じる</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
// useRouter と useRoute は、router.push() を使わないため削除

import RoadmapBase from './RoadmapBase.vue';
import RoadmapChat from './RoadmapChat.vue';
// src/views/ReminderView.vue が存在することを確認し、パスを修正
import ReminderView from '../views/ReminderView.vue'; 

const jwtToken = ref(localStorage.getItem('token') || null);
const backendUrl = 'https://my-image-14467698004.asia-northeast1.run.app/api/roadmap-entries'; 

const roadmapData = ref([]); 
const loading = ref(true);
const apiError = ref(null);

const categoryColors = ref({}); 

const allMonths = [
  { id: 'm4_25', name: '4月', quarterId: 'q2_fy', year: '2025', monthNum: '04' },
  { id: 'm5_25', name: '5月', quarterId: 'q2_fy', year: '2025', monthNum: '05' },
  { id: 'm6_25', name: '6月', quarterId: 'q2_fy', year: '2025', monthNum: '06' },
  { id: 'm7_25', name: '7月', quarterId: 'q3_fy', year: '2025', monthNum: '07' },
  { id: 'm8_25', name: '8月', quarterId: 'q3_fy', year: '2025', monthNum: '08' },
  { id: 'm9_25', name: '9月', quarterId: 'q3_fy', year: '2025', monthNum: '09' },
  { id: 'm10_25', name: '10月', quarterId: 'q4_fy', year: '2025', monthNum: '10' },
  { id: 'm11_25', name: '11月', quarterId: 'q4_fy', year: '2025', monthNum: '11' },
  { id: 'm12_25', name: '12月', quarterId: 'q4_fy', year: '2025', monthNum: '12' },
  { id: 'm1_26', name: '1月', quarterId: 'q1_fy', year: '2026', monthNum: '01' },
  { id: 'm2_26', name: '2月', quarterId: 'q1_fy', year: '2026', monthNum: '02' },
  { id: 'm3_26', name: '3月', quarterId: 'q1_fy', year: '2026', monthNum: '03' },
];

const allQuarters = [
  { id: 'q1_fy', name: 'Q1', startMonthIndex: 9, endMonthIndex: 11 },
  { id: 'q2_fy', name: 'Q2', startMonthIndex: 0, endMonthIndex: 2 },
  { id: 'q3_fy', name: 'Q3', startMonthIndex: 3, endMonthIndex: 5 },
  { id: 'q4_fy', name: 'Q4', startMonthIndex: 6, endMonthIndex: 8 },
];

const DEFAULT_EMPTY_CATEGORIES_COUNT = 4;

onMounted(() => {
  fetchRoadmapData();
});

const generateRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 30) + 70;
  const lightness = Math.floor(Math.random() * 15) + 75;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

watch(roadmapData, (newRoadmapData) => {
  newRoadmapData.forEach(row => {
    if (!Object.prototype.hasOwnProperty.call(categoryColors.value, row.category)) {
      categoryColors.value[row.category] = generateRandomColor();
    }
  });
}, { deep: true });

const handleAddTask = (taskPayload) => {
  const newCategory = taskPayload.category;
  let existingCategoryRow = roadmapData.value.find(row => row.category === newCategory);

  if (!Object.prototype.hasOwnProperty.call(categoryColors.value, newCategory)) {
    categoryColors.value[newCategory] = generateRandomColor();
  }

  const taskData = {
    id: taskPayload.id,
    name: taskPayload.name,
    startIndex: taskPayload.startMonthIndex,
    endIndex: taskPayload.endMonthIndex,
    category: newCategory,
    color: categoryColors.value[newCategory]
  };

  if (existingCategoryRow) {
    existingCategoryRow.tasks.push(taskData);
  } else {
    const newRow = {
      category: newCategory,
      tasks: [taskData],
    };
    roadmapData.value.push(newRow);
    roadmapData.value.sort((a, b) => a.category.localeCompare(b.category));
  }
  saveRoadmapData(); 
};

const handleSaveTaskEdit = (updatedTask) => {
  const categoryIndex = roadmapData.value.findIndex(row => row.category === updatedTask.originalCategory);
  if (categoryIndex === -1) {
    ElMessage.error('元のカテゴリが見つかりませんでした。');
    return;
  }

  const taskIndex = roadmapData.value[categoryIndex].tasks.findIndex(task => task.id === updatedTask.id);
  if (taskIndex === -1) {
    ElMessage.error('編集対象のタスクが見つかりませんでした。');
    return;
  }

  if (updatedTask.category !== updatedTask.originalCategory) {
    roadmapData.value[categoryIndex].tasks.splice(taskIndex, 1);

    if (!Object.prototype.hasOwnProperty.call(categoryColors.value, updatedTask.category)) {
      categoryColors.value[updatedTask.category] = generateRandomColor();
    }

    let newCategoryRow = roadmapData.value.find(row => row.category === updatedTask.category);
    if (newCategoryRow) {
      newCategoryRow.tasks.push({
        id: updatedTask.id,
        name: updatedTask.name,
        startIndex: updatedTask.startMonthIndex,
        endIndex: updatedTask.endMonthIndex,
        category: updatedTask.category,
        color: categoryColors.value[updatedTask.category]
      });
    } else {
      const newRow = {
        category: updatedTask.category,
        tasks: [{
          id: updatedTask.id,
          name: updatedTask.name,
          startIndex: updatedTask.startMonthIndex,
          endIndex: updatedTask.endMonthIndex,
          category: updatedTask.category,
          color: categoryColors.value[updatedTask.category]
        }],
      };
      roadmapData.value.push(newRow);
      roadmapData.value.sort((a, b) => a.category.localeCompare(b.category));
    }
  } else {
    const task = roadmapData.value[categoryIndex].tasks[taskIndex];
    Object.assign(task, {
      name: updatedTask.name,
      startIndex: updatedTask.startMonthIndex,
      endIndex: updatedTask.endMonthIndex,
      category: updatedTask.category,
      color: categoryColors.value[updatedTask.category]
    });
  }
  saveRoadmapData(); 
};

const handleDeleteTask = (taskIdToDelete) => {
  let found = false;
  for (let i = 0; i < roadmapData.value.length; i++) {
    const categoryRow = roadmapData.value[i];
    const taskIndex = categoryRow.tasks.findIndex(task => task.id === taskIdToDelete);
    if (taskIndex !== -1) {
      categoryRow.tasks.splice(taskIndex, 1);
      found = true;
      if (categoryRow.tasks.length === 0 && !categoryRow.category.startsWith('カテゴリ')) {
          roadmapData.value.splice(i, 1);
          i--;
          delete categoryColors.value[categoryRow.category];
      }
      break;
    }
  }
  if (found) {
    saveRoadmapData();
  } else {
    ElMessage.error('削除対象のタスクが見つかりませんでした。');
  }
};


const fetchRoadmapData = async () => {
  loading.value = true;
  apiError.value = null;
  
  let fetchedData = [];

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (jwtToken.value) {
      headers['Authorization'] = `Bearer ${jwtToken.value}`;
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: headers,
    });

    if (response.status === 401 || response.status === 403) {
      apiError.value = '認証情報が無効です。ログインするとデータを編集・保存できます。';
      ElMessage.warning(apiError.value);
      jwtToken.value = null;
      localStorage.removeItem('token');
    } else if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'ロードマップデータの取得に失敗しました。');
    } else {
      const data = await response.json();
      if (Array.isArray(data)) {
          fetchedData = data;
      } else {
        ElMessage.warning('ロードマップデータの形式が予期せぬものでした。');
        console.warn('Unexpected roadmap data format:', data);
      }
    }
  } catch (err) {
    console.error('API Error (fetchRoadmapData):', err);
    apiError.value = err.message || 'ロードマップデータの取得中に予期せぬエラーが発生しました。';
    ElMessage.error(apiError.value);
  } finally {
    const categoriesMap = new Map();
    const newCategoryColors = { ...categoryColors.value };

    if (fetchedData.length > 0) {
        fetchedData.forEach(item => {
            const startMonthData = allMonths.find(m => `${m.year}-${m.monthNum}` === item.startMonth);
            const endMonthData = allMonths.find(m => `${m.year}-${m.monthNum}` === item.endMonth);

            const startIndex = startMonthData ? allMonths.indexOf(startMonthData) : 0;
            const endIndex = endMonthData ? allMonths.indexOf(endMonthData) : 0;

            if (!Object.prototype.hasOwnProperty.call(newCategoryColors, item.category)) {
                newCategoryColors[item.category] = generateRandomColor();
            }

            const task = {
                id: item.id,
                name: item.task,
                startIndex: startIndex,
                endIndex: endIndex,
                category: item.category,
                color: newCategoryColors[item.category]
            };

            if (!categoriesMap.has(item.category)) {
                categoriesMap.set(item.category, { category: item.category, tasks: [] });
            }
            categoriesMap.get(item.category).tasks.push(task);
        });
        roadmapData.value = Array.from(categoriesMap.values()).sort((a, b) => a.category.localeCompare(b.category));
    } else {
      roadmapData.value = [];
    }

    if (roadmapData.value.length < DEFAULT_EMPTY_CATEGORIES_COUNT) {
        const existingCategoryNames = new Set(roadmapData.value.map(row => row.category));
        for (let i = 0; roadmapData.value.length < DEFAULT_EMPTY_CATEGORIES_COUNT; i++) {
            const defaultCategoryName = `カテゴリ${i + 1}`;
            let uniqueCategoryName = defaultCategoryName;
            let counter = 1;
            while (existingCategoryNames.has(uniqueCategoryName)) {
                uniqueCategoryName = `カテゴリ${i + 1}_${counter}`;
                counter++;
            }
            
            if (!Object.prototype.hasOwnProperty.call(newCategoryColors, uniqueCategoryName)) {
                newCategoryColors[uniqueCategoryName] = generateRandomColor();
            }
            roadmapData.value.push({ category: uniqueCategoryName, tasks: [] });
            existingCategoryNames.add(uniqueCategoryName);
        }
        roadmapData.value.sort((a, b) => a.category.localeCompare(b.category));
    }
    
    categoryColors.value = newCategoryColors;

    loading.value = false;
  }
};

const saveRoadmapData = async () => {
  apiError.value = null;
  if (!jwtToken.value) {
    ElMessage.error('エラー: 認証トークンがありません。ログインしてください。');
    return;
  }

  const dataToSend = [];
  roadmapData.value.forEach(categoryRow => {
      if (categoryRow.tasks && categoryRow.tasks.length > 0) {
          const category = categoryRow.category;
          categoryRow.tasks.forEach(task => {
              const startMonth = allMonths[task.startIndex] ? `${allMonths[task.startIndex].year}-${allMonths[task.startIndex].monthNum}` : null;
              const endMonth = allMonths[task.endIndex] ? `${allMonths[task.endIndex].year}-${allMonths[task.endIndex].monthNum}` : null;

              dataToSend.push({
                  id: task.id,
                  category: category,
                  task: task.name,
                  startMonth: startMonth,
                  endMonth: endMonth,
              });
          });
      }
  });

  if (dataToSend.length === 0) {
    ElMessage.info('保存するタスクデータがありません。');
    return;
  }

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });

    if (response.status === 401 || response.status === 403) {
      apiError.value = '認証情報が無効です。再度ログインしてください。';
      ElMessage.error(apiError.value);
      jwtToken.value = null;
      localStorage.removeItem('token');
      return;
    }
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'ロードマップデータの保存に失敗しました。');
    }

    ElMessage.success('ロードマップデータを正常に保存しました！');
    
  } catch (err) {
    console.error('API Error (saveRoadmapData):', err);
    apiError.value = err.message || 'ロードマップデータの保存中に予期せぬエラーが発生しました。';
    ElMessage.error(apiError.value);
  }
};

// AIチャットモーダルの状態管理
const isAIChatModalOpen = ref(false);

const openAIChatModal = () => {
  isAIChatModalOpen.value = true;
};

const closeAIChatModal = () => {
  isAIChatModalOpen.value = false;
};

// リマインダー作成モーダルの状態管理
const isReminderModalOpen = ref(false);

const goToReminderForm = () => {
  isReminderModalOpen.value = true; // モーダルとして開く
};

const closeReminderModal = () => {
  isReminderModalOpen.value = false;
};
</script>

<style scoped>
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
  /* 非表示にしているため、位置調整は不要かもしれませんが、念のため */
  display: none; /* v-if="false" と合わせて非表示 */
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