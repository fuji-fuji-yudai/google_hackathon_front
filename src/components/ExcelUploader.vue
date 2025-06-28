<template>
  <div class="excel-uploader">
    <el-upload class="upload-area" action="#" :http-request="handleUpload" :show-file-list="false" accept=".xlsx,.xls"
      :before-upload="beforeUpload">
      <el-icon class="upload-icon">
        <Upload />
      </el-icon>
      <div class="upload-text">
        機能一覧Excelをアップロード
      </div>
    </el-upload>

    <el-dialog v-model="previewVisible" title="タスク分割プレビュー" width="80%">
      <div v-if="isLoading" class="loading-container">
        <el-icon class="loading-icon">
          <Loading />
        </el-icon>
        <div>Excelを解析しています...</div>
      </div>

      <div v-else>
        <div v-if="generatedTasks.length === 0" class="no-tasks">
          タスクが見つかりませんでした
        </div>

        <div v-else>
          <div class="task-preview">
            <h3>作成されるタスク（{{ generatedTasks.length }}件）</h3>

            <el-tree :data="taskTree" node-key="id" default-expand-all :props="{
              label: 'title',
              children: 'children'
            }">
              <template #default="{ data }">
                <div class="task-node">
                  <span>{{ data.title }}</span>
                  <span v-if="data.assignee" class="task-assignee">担当: {{ data.assignee }}</span>
                </div>
              </template>
            </el-tree>
          </div>

          <div class="action-buttons">
            <el-button @click="previewVisible = false">キャンセル</el-button>
            <el-button type="primary" @click="importTasks" :loading="isImporting">
              {{ isImporting ? 'インポート中...' : 'タスクをインポート' }}
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="errorVisible" title="エラー" width="400px">
      <div class="error-message">
        {{ errorMessage }}
      </div>
      <template #footer>
        <el-button @click="errorVisible = false">閉じる</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { Upload, Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

export default {
  components: {
    Upload,
    Loading
  },
  emits: ['tasks-generated'],
  setup(props, { emit }) {
    const previewVisible = ref(false);
    const errorVisible = ref(false);
    const errorMessage = ref('');
    const isLoading = ref(false);
    const isImporting = ref(false);
    const generatedTasks = ref([]);

    // Excelファイルの検証
    const beforeUpload = (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel';

      if (!isExcel) {
        errorMessage.value = 'Excelファイル(.xlsx, .xls)のみアップロードできます';
        errorVisible.value = true;
        return false;
      }

      return true;
    };

    // Excelアップロード処理
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

        // データの正規化: snake_case形式に統一
        generatedTasks.value = data.map((task, index) => ({
          id: task.id,
          title: task.title,
          assignee: task.assignee,
          plan_start: task.plan_start,
          plan_end: task.plan_end,
          actual_start: task.actual_start || "",
          actual_end: task.actual_end || "",
          status: task.status || "ToDo",
          parent_id: task.parent_id != null ? task.parent_id : (task.parentId || null)
        }));

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

    // 階層構造のタスクツリーを生成
    const taskTree = computed(() => {
      const result = [];
      const map = {};

      // まず全タスクをマップに登録
      generatedTasks.value.forEach(task => {
        map[task.id] = { ...task, children: [] };
      });

      // 親子関係を構築
      generatedTasks.value.forEach(task => {
        const parentId = task.parent_id;
        if (parentId && map[parentId]) {
          map[parentId].children.push(map[task.id]);
        } else {
          result.push(map[task.id]);
        }
      });

      return result;
    });

    // タスクインポート処理（DBに保存）
    const importTasks = async () => {
      isImporting.value = true;

      try {
        console.log('=== タスクインポート開始 ===');
        console.log('インポート対象タスク:', generatedTasks.value);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('認証トークンが見つかりません');
        }

        const importUrl = 'https://my-image-14467698004.asia-northeast1.run.app/api/tasks/import-excel-tasks';
        console.log('=== API呼び出し開始 ===');
        console.log('URL:', importUrl);
        console.log('送信データ:', JSON.stringify(generatedTasks.value, null, 2));

        // DBに保存するためのAPIを呼び出し
        const response = await fetch(importUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(generatedTasks.value),
        });

        console.log('=== レスポンス受信 ===');
        console.log('ステータス:', response.status);
        console.log('ステータステキスト:', response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('=== エラーレスポンス ===');
          console.error('エラー内容:', errorText);
          throw new Error(`インポートに失敗しました: ${response.status} - ${errorText}`);
        }

        const savedTasks = await response.json();
        console.log('=== DB保存完了 ===');
        console.log('保存されたタスク数:', savedTasks.length);
        console.log('保存されたタスク:', savedTasks);

        // 親コンポーネントに通知（画面に反映するため）
        emit('tasks-generated', savedTasks);

        ElMessage.success(`${savedTasks.length}件のタスクをインポートしました`);
        previewVisible.value = false;

      } catch (error) {
        console.error('=== インポートエラー ===');
        console.error('エラー詳細:', error);
        console.error('エラーメッセージ:', error.message);
        console.error('エラースタック:', error.stack);

        errorMessage.value = 'タスクのインポートに失敗しました: ' + error.message;
        errorVisible.value = true;
      } finally {
        isImporting.value = false;
      }
    };

    return {
      previewVisible,
      errorVisible,
      errorMessage,
      isLoading,
      isImporting,
      generatedTasks,
      taskTree,
      beforeUpload,
      handleUpload,
      importTasks
    };
  }
}
</script>

<style scoped>
.excel-uploader {
  margin-top: 20px;
  margin-bottom: 20px;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 10px 0;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-icon {
  font-size: 20px;
  color: #c0c4cc;
  margin-bottom: 0px;
}

.upload-text {
  color: #606266;
  font-size: 16px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-icon {
  font-size: 32px;
  color: #409eff;
  animation: rotate 1.5s linear infinite;
  margin-bottom: 16px;
}

.task-preview {
  margin-bottom: 20px;
}

.task-node {
  display: flex;
  align-items: center;
}

.task-assignee {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.no-tasks {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.error-message {
  color: #f56c6c;
  text-align: center;
  padding: 20px 0;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>