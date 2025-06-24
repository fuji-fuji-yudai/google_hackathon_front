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

    // バックエンドのURLは画像から確認できるものを正確に指定
    const backendUrl = 'https://my-image-14467698004.asia-northeast1.run.app/api/roadmap-entries';

    // allMonths の monthNum を数値型に変更し、monthNumber にリネーム
    const allMonths = [
      { id: 'm4_25', name: '4月', quarterId: 'q2_fy', year: 2025, monthNumber: 4 },
      { id: 'm5_25', name: '5月', quarterId: 'q2_fy', year: 2025, monthNumber: 5 },
      { id: 'm6_25', name: '6月', quarterId: 'q2_fy', year: 2025, monthNumber: 6 },
      { id: 'm7_25', name: '7月', quarterId: 'q3_fy', year: 2025, monthNumber: 7 },
      { id: 'm8_25', name: '8月', quarterId: 'q3_fy', year: 2025, monthNumber: 8 },
      { id: 'm9_25', name: '9月', quarterId: 'q3_fy', year: 2025, monthNumber: 9 },
      { id: 'm10_25', name: '10月', quarterId: 'q4_fy', year: 2025, monthNumber: 10 },
      { id: 'm11_25', name: '11月', quarterId: 'q4_fy', year: 2025, monthNumber: 11 },
      { id: 'm12_25', name: '12月', quarterId: 'q4_fy', year: 2025, monthNumber: 12 },
      { id: 'm1_26', name: '1月', quarterId: 'q1_fy', year: 2026, monthNumber: 1 },
      { id: 'm2_26', name: '2月', quarterId: 'q1_fy', year: 2026, monthNumber: 2 },
      { id: 'm3_26', name: '3月', quarterId: 'q1_fy', year: 2026, monthNumber: 3 },
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
          // jwtToken.value = null; // 本番では有効化
          // localStorage.removeItem('token'); // 本番では有効化
        } else if (!response.ok) {
          // エラーレスポンスがHTMLである可能性を考慮し、テキストとして取得
          const errorText = await response.text(); 
          console.error('Server returned non-JSON error or bad status for GET:', errorText);
          throw new Error(errorText || 'ロードマップデータの取得に失敗しました。');
        } else {
          // 成功レスポンスはJSONとしてパース
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
                // バックエンドから返される startMonth, endMonth が「数値の月番号」だと仮定
                // フロントエンドの表示に必要な startIndex, endIndex を allMonths から見つける
                const startMonthData = allMonths.find(m => m.monthNumber === item.startMonth && m.year === item.startYear); // 年も考慮するなら
                const endMonthData = allMonths.find(m => m.monthNumber === item.endMonth && m.year === item.endYear); // 年も考慮するなら

                const startIndex = startMonthData ? allMonths.indexOf(startMonthData) : 0;
                const endIndex = endMonthData ? allMonths.indexOf(endMonthData) : 0;

                // 新しいカテゴリの色を生成
                if (!Object.prototype.hasOwnProperty.call(newCategoryColors, item.categoryName)) { 
                    newCategoryColors[item.categoryName] = generateRandomColor(); 
                }

                const task = {
                    id: item.id,
                    name: item.taskName, 
                    startIndex: startIndex, // 表示用のインデックス
                    endIndex: endIndex,     // 表示用のインデックス
                    category: item.categoryName, 
                    color: newCategoryColors[item.categoryName] 
                };

                if (!categoriesMap.has(item.categoryName)) { 
                    categoriesMap.set(item.categoryName, { category: item.categoryName, tasks: [] }); 
                }
                categoriesMap.get(item.categoryName).tasks.push(task); 
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
            return;
        }

        const newCategory = taskPayload.category;
        // RoadmapTaskAddFormから直接月番号が渡されるため、startIndex/endIndexを使った変換は不要
        // taskPayload.startMonth と taskPayload.endMonth には既に数値の月番号が入っている
        
        const payload = {
            categoryName: newCategory,
            taskName: taskPayload.name,
            startMonth: taskPayload.startMonth, // RoadmapTaskAddFormでv-modelにバインドされた数値
            endMonth: taskPayload.endMonth,     // RoadmapTaskAddFormでv-modelにバインドされた数値
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
                // jwtToken.value = null; // 本番では有効化
                // localStorage.removeItem('token'); // 本番では有効化
                return;
            }
            if (!response.ok) {
                // エラーレスポンスがHTMLである可能性を考慮し、テキストとして取得
                const errorText = await response.text(); 
                console.error('Server returned non-JSON error or bad status for POST:', errorText);
                throw new Error(`タスクの追加に失敗しました。サーバーからのレスポンス: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}...`);
            }

            // 成功レスポンスはJSONとしてパース
            await response.json(); // Consume the response
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
            return;
        }
        if (!updatedTask.id) {
            ElMessage.error('エラー: 編集対象のタスクIDがありません。');
            return;
        }

        // updatedTask.startMonth と updatedTask.endMonth は既に数値の月番号
        const payload = {
            id: updatedTask.id, // PUTリクエストではIDを含める
            categoryName: updatedTask.category,
            taskName: updatedTask.name,
            startMonth: updatedTask.startMonth, // RoadmapTaskAddFormでv-modelにバインドされた数値
            endMonth: updatedTask.endMonth,     // RoadmapTaskAddFormでv-modelにバインドされた数値
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
                // jwtToken.value = null; // 本番では有効化
                // localStorage.removeItem('token'); // 本番では有効化
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
                // jwtToken.value = null; // 本番では有効化
                // localStorage.removeItem('token'); // 本番では有効化
                return;
            }
            if (!response.ok) {
                const errorText = await response.text(); // DELETEは通常レスポンスボディがないか、あってもJSONではない場合がある
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
/* スタイルは変更なし */
.roadmap-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}
</style>