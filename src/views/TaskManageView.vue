// ExcelUploader.vueの修正箇所

// データ正規化の修正
const handleUpload = async (options) => {
  const { file } = options;
  isLoading.value = true;
  previewVisible.value = true;
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch('https://my-image-14467698004.asia-northeast1.run.app/api/tasks/analyze-excel', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`エラーが発生しました: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('=== Excel分析結果 ===');
    console.log('生成されたタスク数:', data.length);
    console.log('タスク一覧:', data);
    
    // データの詳細確認（デバッグ用）
    data.forEach((task, index) => {
      console.log(`タスク${index}: title="${task.title}", tmp_id=${task.tmp_id}, tmp_parent_id=${task.tmp_parent_id}`);
    });
    
    // データの正規化: 必要なフィールドを確実に設定
    generatedTasks.value = data.map((task, index) => {
      const normalizedTask = {
        id: task.id || null,
        title: task.title || `タスク${index + 1}`,
        assignee: task.assignee || "",
        plan_start: task.plan_start || "",
        plan_end: task.plan_end || "",
        actual_start: task.actual_start || "",
        actual_end: task.actual_end || "",
        status: task.status || "ToDo",
        parent_id: task.parent_id || null,
        tmp_id: task.tmp_id || (index + 1), // tmp_idがない場合は連番を設定
        tmp_parent_id: task.tmp_parent_id || null
      };
      
      console.log(`正規化後タスク${index}:`, normalizedTask);
      return normalizedTask;
    });
    
    console.log('=== 調整後のタスク ===');
    console.log(generatedTasks.value);
    
  } catch (error) {
    console.error('Excelの解析に失敗しました:', error);
    errorMessage.value = 'Excelの解析に失敗しました: ' + error.message;
    errorVisible.value = true;
    previewVisible.value = false;
  } finally {
    isLoading.value = false;
  }
};

// taskTree計算ロジックの修正
const taskTree = computed(() => {
  console.log('=== taskTree計算開始 ===');
  console.log('generatedTasks.value:', generatedTasks.value);
  
  const result = [];
  const map = {};
  
  // Step 1: 全タスクをマップに登録
  generatedTasks.value.forEach((task, index) => {
    const key = task.tmp_id || task.id || index;
    map[key] = { 
      ...task, 
      children: [],
      key: key // デバッグ用
    };
    console.log(`マップ登録: key=${key}, title="${task.title}", tmp_parent_id=${task.tmp_parent_id}`);
  });
  
  console.log('=== マップ構築完了 ===');
  console.log('map:', map);
  
  // Step 2: 親子関係を構築
  generatedTasks.value.forEach((task, index) => {
    const taskKey = task.tmp_id || task.id || index;
    const parentKey = task.tmp_parent_id;
    
    console.log(`親子関係チェック: taskKey=${taskKey}, parentKey=${parentKey}, title="${task.title}"`);
    
    if (parentKey !== null && parentKey !== undefined && map[parentKey]) {
      // 親が存在する場合、親の子として追加
      map[parentKey].children.push(map[taskKey]);
      console.log(`  -> 親 "${map[parentKey].title}" の子として追加`);
    } else {
      // 親が存在しない場合、ルートレベルに追加
      result.push(map[taskKey]);
      console.log(`  -> ルートレベルに追加`);
    }
  });
  
  console.log('=== taskTree計算完了 ===');
  console.log('result:', result);
  
  return result;
});

// テンプレート部分の修正
/*
<el-tree
  :data="taskTree"
  node-key="tmp_id"
  default-expand-all
  :props="{ 
    label: 'title',
    children: 'children'
  }"
>
  <template #default="{ data }">
    <div class="task-node">
      <span>{{ data.title }}</span>
      <span v-if="data.assignee" class="task-assignee">担当: {{ data.assignee }}</span>
      <span class="task-debug" style="font-size: 10px; color: #999;">
        (tmp_id: {{ data.tmp_id }}, tmp_parent_id: {{ data.tmp_parent_id }})
      </span>
    </div>
  </template>
</el-tree>
*/