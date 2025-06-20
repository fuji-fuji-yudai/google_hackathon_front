<template>
  <div class="roadmap-view">
    <RoadmapManager 
      :jwt-token="jwtToken"
      :api-error="apiError"
      :loading="loading"
      :roadmap-data="roadmapDataForManager"
      :category-colors="categoryColorsForManager"
      :all-months="allMonths"       :all-quarters="allQuarters"   @add-task-to-manager="handleAddTask"
      @save-task-edit-to-manager="handleSaveTaskEdit"
      @delete-task-to-manager="handleDeleteTask"
      @request-logout="handleLogout"
    />
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import RoadmapManager from '../components/RoadmapManager.vue';

export default {
  name: 'RoadmapView',
  components: {
    RoadmapManager,
  },
  setup() {
    const jwtToken = ref(localStorage.getItem('token') || null);
    const loading = ref(true);
    const apiError = ref(null);

    const backendUrl = 'https://my-image-14467698004.asia-northeast1.run.app/api/roadmap-entries';

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

    const roadmapDataForManager = ref([]);
    const categoryColorsForManager = ref({});

    const generateRandomColor = () => {
      const hue = Math.floor(Math.random() * 360);
      const saturation = Math.floor(Math.random() * 30) + 70;
      const lightness = Math.floor(Math.random() * 15) + 75;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    watch(roadmapDataForManager, (newRoadmapData) => {
        newRoadmapData.forEach(row => {
            if (!Object.prototype.hasOwnProperty.call(categoryColorsForManager.value, row.category)) {
                categoryColorsForManager.value[row.category] = generateRandomColor();
            }
        });
    }, { deep: true });


    const fetchRoadmapData = async () => {
      loading.value = true;
      apiError.value = null;
      
      let fetchedRawData = [];

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
            fetchedRawData = data;
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
        const newCategoryColors = { ...categoryColorsForManager.value };

        if (fetchedRawData.length > 0) {
            fetchedRawData.forEach(item => {
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
            roadmapDataForManager.value = Array.from(categoriesMap.values()).sort((a, b) => a.category.localeCompare(b.category));
        } else {
          roadmapDataForManager.value = [];
        }

        if (roadmapDataForManager.value.length < DEFAULT_EMPTY_CATEGORIES_COUNT) {
            const existingCategoryNames = new Set(roadmapDataForManager.value.map(row => row.category));
            for (let i = 0; roadmapDataForManager.value.length < DEFAULT_EMPTY_CATEGORIES_COUNT; i++) {
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
                roadmapDataForManager.value.push({ category: uniqueCategoryName, tasks: [] });
                existingCategoryNames.add(uniqueCategoryName);
            }
            roadmapDataForManager.value.sort((a, b) => a.category.localeCompare(b.category));
        }
        categoryColorsForManager.value = newCategoryColors;
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
      roadmapDataForManager.value.forEach(categoryRow => {
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


    const handleAddTask = (taskPayload) => {
        const newCategory = taskPayload.category;
        let existingCategoryRow = roadmapDataForManager.value.find(row => row.category === newCategory);

        if (!Object.prototype.hasOwnProperty.call(categoryColorsForManager.value, newCategory)) {
            categoryColorsForManager.value[newCategory] = generateRandomColor();
        }

        const taskData = {
            id: taskPayload.id,
            name: taskPayload.name,
            startIndex: taskPayload.startMonthIndex,
            endIndex: taskPayload.endMonthIndex,
            category: newCategory,
            color: categoryColorsForManager.value[newCategory]
        };

        if (existingCategoryRow) {
            existingCategoryRow.tasks.push(taskData);
        } else {
            const newRow = {
                category: newCategory,
                tasks: [taskData],
            };
            roadmapDataForManager.value.push(newRow);
            roadmapDataForManager.value.sort((a, b) => a.category.localeCompare(b.category));
        }
        saveRoadmapData();
    };

    const handleSaveTaskEdit = (updatedTask) => {
        const categoryIndex = roadmapDataForManager.value.findIndex(row => row.category === updatedTask.originalCategory);
        if (categoryIndex === -1) {
            ElMessage.error('元のカテゴリが見つかりませんでした。');
            return;
        }

        const taskIndex = roadmapDataForManager.value[categoryIndex].tasks.findIndex(task => task.id === updatedTask.id);
        if (taskIndex === -1) {
            ElMessage.error('編集対象のタスクが見つかりませんでした。');
            return;
        }

        if (updatedTask.category !== updatedTask.originalCategory) {
            roadmapDataForManager.value[categoryIndex].tasks.splice(taskIndex, 1);

            if (!Object.prototype.hasOwnProperty.call(categoryColorsForManager.value, updatedTask.category)) {
                categoryColorsForManager.value[updatedTask.category] = generateRandomColor();
            }

            let newCategoryRow = roadmapDataForManager.value.find(row => row.category === updatedTask.category);
            if (newCategoryRow) {
                newCategoryRow.tasks.push({
                    id: updatedTask.id,
                    name: updatedTask.name,
                    startIndex: updatedTask.startMonthIndex,
                    endIndex: updatedTask.endMonthIndex,
                    category: updatedTask.category,
                    color: categoryColorsForManager.value[updatedTask.category]
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
                        color: categoryColorsForManager.value[updatedTask.category]
                    }],
                };
                roadmapDataForManager.value.push(newRow);
                roadmapDataForManager.value.sort((a, b) => a.category.localeCompare(b.category));
            }
        } else {
            const task = roadmapDataForManager.value[categoryIndex].tasks[taskIndex];
            Object.assign(task, {
                name: updatedTask.name,
                startIndex: updatedTask.startMonthIndex,
                endIndex: updatedTask.endMonthIndex,
                category: updatedTask.category,
                color: categoryColorsForManager.value[updatedTask.category]
            });
        }
        saveRoadmapData();
    };

    const handleDeleteTask = (taskIdToDelete) => {
        let found = false;
        for (let i = 0; i < roadmapDataForManager.value.length; i++) {
            const categoryRow = roadmapDataForManager.value[i];
            const taskIndex = categoryRow.tasks.findIndex(task => task.id === taskIdToDelete);
            if (taskIndex !== -1) {
                categoryRow.tasks.splice(taskIndex, 1);
                found = true;
                if (categoryRow.tasks.length === 0 && !categoryRow.category.startsWith('カテゴリ')) {
                    roadmapDataForManager.value.splice(i, 1);
                    i--;
                    delete categoryColorsForManager.value[categoryRow.category];
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

    const handleLogout = () => {
        jwtToken.value = null;
        localStorage.removeItem('token');
        ElMessage.info('ログアウトしました。');
        // router.push('/login'); // 必要であればログインページへリダイレクト
    };

    onMounted(() => {
      fetchRoadmapData();
    });

    return {
      jwtToken,
      loading,
      apiError,
      roadmapDataForManager,
      categoryColorsForManager,
      allMonths,       // テンプレートに渡すのでreturnに追加
      allQuarters,     // テンプレートに渡すのでreturnに追加
      handleAddTask,
      handleSaveTaskEdit,
      handleDeleteTask,
      handleLogout,
    };
  },
};
</script>

<style scoped>
.roadmap-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}
</style>