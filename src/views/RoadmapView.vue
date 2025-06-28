<template>
  <div class="roadmap-view">
    <RoadmapManager
      :jwt-token="jwtToken"
      :api-error="apiError"
      :loading="loading"
      :roadmap-data="roadmapDataForManager"
      :category-colors="categoryColorsForManager"
      :all-months="allMonths"
      :all-quarters="allQuarters"
      @add-task-to-manager="handleAddTask"
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
import { useRouter } from 'vue-router';

export default {
  name: 'RoadmapView',
  components: {
    RoadmapManager,
  },
  setup() {
    const jwtToken = ref(localStorage.getItem('token') || null);
    const loading = ref(true);
    const apiError = ref(null);
    const router = useRouter();

    const backendUrl = 'https://my-image-14467698004.asia-northeast1.run.app/api/roadmap-entries';

    // 現在の年を含めて合計5年間表示
    const TOTAL_DISPLAY_YEARS = 5;

    const allMonths = ref([]);
    const allQuarters = ref([]);

    const generateTimeline = () => {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear;
        //終了年を「現在の年 + (合計年数 - 1)」に設定
        const endYear = currentYear + (TOTAL_DISPLAY_YEARS - 1);

        const months = [];
        const quartersMap = new Map();

        for (let year = startYear; year <= endYear; year++) {
            for (let monthNum = 1; monthNum <= 12; monthNum++) {
                const monthId = `m${monthNum}_${year}`;
                const monthName = `${monthNum}月`;

                let quarterId;
                let quarterNamePrefix;
                if (monthNum >= 1 && monthNum <= 3) {
                    quarterId = `Q1_${year}`;
                    quarterNamePrefix = 'Q1';
                } else if (monthNum >= 4 && monthNum <= 6) {
                    quarterId = `Q2_${year}`;
                    quarterNamePrefix = 'Q2';
                } else if (monthNum >= 7 && monthNum <= 9) {
                    quarterId = `Q3_${year}`;
                    quarterNamePrefix = 'Q3';
                } else {
                    quarterId = `Q4_${year}`;
                    quarterNamePrefix = 'Q4';
                }

                //月を追加する前に、その月のインデックスを把握
                const currentMonthIndex = months.length;

                months.push({
                    id: monthId,
                    name: monthName,
                    quarterId: quarterId,
                    year: year,
                    monthNumber: monthNum,
                });

                if (!quartersMap.has(quarterId)) {
                    quartersMap.set(quarterId, {
                        id: quarterId,
                        name: `${quarterNamePrefix} ${year}年`,
                        startMonthIndex: currentMonthIndex, //その四半期に属する最初の月のインデックス
                        endMonthIndex: currentMonthIndex, //最初の時点では開始と同じ
                    });
                } else {
                    const q = quartersMap.get(quarterId);
                    q.endMonthIndex = currentMonthIndex;
                }
            }
        }

        allMonths.value = months;
        allQuarters.value = Array.from(quartersMap.values());
        console.log('Generated allMonths (total 5 years):', allMonths.value);
        console.log('Generated allQuarters (total 5 years):', allQuarters.value);
    };

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
          console.log('Sending Authorization Header (GET):', headers['Authorization']);
        } else {
          console.warn('JWT Token is not available in localStorage. Proceeding without authentication.');
        }

        const response = await fetch(backendUrl, {
          method: 'GET',
          headers: headers,
        });

        if (response.status === 401 || response.status === 403) {
          apiError.value = '認証情報が無効です。ログインするとデータを編集・保存できます。';
          ElMessage.warning(apiError.value);
          router.push('/login');
        } else if (!response.ok) {
          const errorText = await response.text();
          console.error('Server returned non-JSON error or bad status for GET:', errorText);
          throw new Error(errorText || 'ロードマップデータの取得に失敗しました。');
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
                const startMonthData = allMonths.value.find(
                    m => m.monthNumber === item.startMonth && m.year === item.startYear
                );
                const endMonthData = allMonths.value.find(
                    m => m.monthNumber === item.endMonth && m.year === item.endYear
                );

                const startIndex = startMonthData ? allMonths.value.indexOf(startMonthData) : -1;
                const endIndex = endMonthData ? allMonths.value.indexOf(endMonthData) : -1;

                console.log(`DEBUG (RoadmapView): Fetched Item ID: ${item.id}, Name: ${item.taskName}, Raw SM: ${item.startMonth}, Raw EM: ${item.endMonth}, Raw SY: ${item.startYear}, Raw EY: ${item.endYear}, Converted SI: ${startIndex}, Converted EI: ${endIndex}`);

                if (startIndex !== -1 && endIndex !== -1) {
                    if (!Object.prototype.hasOwnProperty.call(newCategoryColors, item.categoryName)) {
                        newCategoryColors[item.categoryName] = generateRandomColor();
                    }

                    const task = {
                        id: item.id,
                        name: item.taskName,
                        startIndex: startIndex,
                        endIndex: endIndex,
                        category: item.categoryName,
                        color: newCategoryColors[item.categoryName],
                        startMonth: item.startMonth,
                        endMonth: item.endMonth,
                        startYear: item.startYear,
                        endYear: item.endYear,
                    };

                    if (!categoriesMap.has(item.categoryName)) {
                        categoriesMap.set(item.categoryName, { category: item.categoryName, tasks: [] });
                    }
                    categoriesMap.get(item.categoryName).tasks.push(task);
                } else {
                    console.warn(`タスク "${item.taskName}" (${item.id}) の期間情報が不正なため表示できませんでした: 開始月/年または終了月/年がロードマップ期間内に見つかりません。`);
                }
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

    const handleAddTask = async (taskPayload) => {
        if (!jwtToken.value) {
            ElMessage.error('エラー: 認証トークンがありません。ログインしてください。');
            router.push('/login');
            return;
        }

        const payload = {
            categoryName: taskPayload.category,
            taskName: taskPayload.name,
            startMonth: taskPayload.startMonth,
            endMonth: taskPayload.endMonth,
            startYear: taskPayload.startYear,
            endYear: taskPayload.endYear,
        };

        try {
            console.log('Sending POST request to add task:', payload);
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${jwtToken.value}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 401 || response.status === 403) {
                apiError.value = '認証情報が無効です。再度ログインしてください。';
                ElMessage.error(apiError.value);
                router.push('/login');
                return;
            }
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server returned non-JSON error or bad status for POST:', errorText);
                throw new Error(`タスクの追加に失敗しました。サーバーからのレスポンス: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}...`);
            }

            await response.json();
            ElMessage.success('タスクを正常に追加しました！');
            fetchRoadmapData();

        } catch (err) {
            console.error('API Error (handleAddTask):', err);
            apiError.value = err.message || 'タスクの追加中に予期せぬエラーが発生しました。';
            ElMessage.error(apiError.value);
        }
    };

    const handleSaveTaskEdit = async (updatedTask) => {
        if (!jwtToken.value) {
            ElMessage.error('エラー: 認証トークンがありません。ログインしてください。');
            router.push('/login');
            return;
        }
        if (!updatedTask.id) {
            ElMessage.error('エラー: 編集対象のタスクIDがありません。');
            return;
        }

        const payload = {
            categoryName: updatedTask.category,
            taskName: updatedTask.name,
            startMonth: updatedTask.startMonth,
            endMonth: updatedTask.endMonth,
            startYear: updatedTask.startYear,
            endYear: updatedTask.endYear,
        };

        try {
            console.log('Sending PUT request to update task:', payload);
            const response = await fetch(`${backendUrl}/${updatedTask.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${jwtToken.value}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 401 || response.status === 403) {
                apiError.value = '認証情報が無効です。再度ログインしてください。';
                ElMessage.error(apiError.value);
                router.push('/login');
                return;
            }
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server returned non-JSON error or bad status for PUT:', errorText);
                throw new Error(`タスクの編集に失敗しました。サーバーからのレスポンス: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}...`);
            }

            ElMessage.success('タスクを正常に更新しました！');
            fetchRoadmapData();

        } catch (err) {
            console.error('API Error (handleSaveTaskEdit):', err);
            apiError.value = err.message || 'タスクの編集中に予期せぬエラーが発生しました。';
            ElMessage.error(apiError.value);
        }
    };

    const handleDeleteTask = async (taskIdToDelete) => {
        if (!jwtToken.value) {
            ElMessage.error('エラー: 認証トークンがありません。ログインしてください。');
            router.push('/login');
            return;
        }
        if (!taskIdToDelete) {
            ElMessage.error('エラー: 削除対象のタスクIDがありません。');
            return;
        }

        try {
            console.log(`Sending DELETE request for task ID: ${taskIdToDelete}`);
            const response = await fetch(`${backendUrl}/${taskIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${jwtToken.value}`,
                },
            });

            if (response.status === 401 || response.status === 403) {
                apiError.value = '認証情報が無効です。再度ログインしてください。';
                ElMessage.error(apiError.value);
                router.push('/login');
                return;
            }
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server returned non-JSON error or bad status for DELETE:', errorText);
                throw new Error(`タスクの削除に失敗しました。サーバーからのレスポンス: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}...`);
            }

            ElMessage.success('タスクを正常に削除しました！');
            fetchRoadmapData();

        } catch (err) {
            console.error('API Error (handleDeleteTask):', err);
            apiError.value = err.message || 'タスクの削除中に予期せぬエラーが発生しました。';
            ElMessage.error(apiError.value);
        }
    };

    const handleLogout = () => {
        jwtToken.value = null;
        localStorage.removeItem('token');
        ElMessage.info('ログアウトしました。');
        router.push('/login');
    };

    onMounted(() => {
      generateTimeline();
      fetchRoadmapData();
    });

    return {
      jwtToken,
      loading,
      apiError,
      roadmapDataForManager,
      categoryColorsForManager,
      allMonths,
      allQuarters,
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