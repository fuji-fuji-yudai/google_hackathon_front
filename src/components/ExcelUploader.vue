<template>
  <div class="excel-uploader">
    <el-upload
      class="upload-area"
      action="#"
      :http-request="handleUpload"
      :show-file-list="false"
      accept=".xlsx,.xls"
      :before-upload="beforeUpload"
    >
      <el-icon class="upload-icon"><Upload /></el-icon>
      <div class="upload-text">
        機能一覧Excelをアップロード
      </div>
    </el-upload>
    
    <el-dialog
      v-model="previewVisible"
      title="タスク分割プレビュー"
      width="80%"
    >
      <div v-if="isLoading" class="loading-container">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <div>Excelを解析しています...</div>
      </div>
      
      <div v-else>
        <div v-if="generatedTasks.length === 0" class="no-tasks">
          タスクが見つかりませんでした
        </div>
        
        <div v-else>
          <div class="task-preview">
            <h3>作成されるタスク（{{ generatedTasks.length }}件）</h3>
            
            <el-tree
              :data="taskTree"
              node-key="id"
              default-expand-all
              :props="{ 
                label: 'title',
                children: 'children'
              }"
            >
              <template #default="{data }">
                <div class="task-node">
                  <span>{{ data.title }}</span>
                  <span v-if="data.assignee" class="task-assignee">担当: {{ data.assignee }}</span>
                </div>
              </template>
            </el-tree>
          </div>
          
          <div class="action-buttons">
            <el-button @click="previewVisible = false">キャンセル</el-button>
            <el-button type="primary" @click="importTasks">タスクをインポート</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
    
    <el-dialog
      v-model="errorVisible"
      title="エラー"
      width="400px"
    >
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
        generatedTasks.value = data.map(task => ({
          ...task,
          id: `temp_${Math.random().toString(36).substr(2, 9)}` // 一時IDを付与
        }));
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
        if (task.parentId) {
          const parent = map[task.parentId];
          if (parent) {
            parent.children.push(map[task.id]);
          } else {
            result.push(map[task.id]);
          }
        } else {
          result.push(map[task.id]);
        }
      });
      
      return result;
    });
    
    // タスクインポート処理
    const importTasks = () => {
      emit('tasks-generated', generatedTasks.value);
      previewVisible.value = false;
    };
    
    return {
      previewVisible,
      errorVisible,
      errorMessage,
      isLoading,
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
  margin-bottom: 20px;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: px;
  padding: 10px 0;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
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