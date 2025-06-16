<template>
  <div>
    <el-radio-group
      v-model="viewMode"
      style="margin-bottom: 20px"
    >
      <el-radio-button label="card">
        カード
      </el-radio-button>
      <el-radio-button label="timeline">
        タイムライン
      </el-radio-button>
    </el-radio-group>

    <CardBoardView
      v-if="viewMode === 'card'"
      :tasks="tasks"
      @update="handleUpdate"
    />
    <TimelineBoard
      v-else
      :tasks="tasks"
      @update="handleUpdate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import CardBoardView from '@/components/CardBoardView.vue'
import TimelineBoard from '@/components/TimelineBoard.vue'

const viewMode = ref('card')
const tasks = ref([]) // 初期値は空配列

// // 共通のタスクデータ（ローカル用）
// const tasks = ref([
//   {
//     id: 'task-1',
//     title: '要件定義',
//     assignee: '佐藤',
//     planStart: '2025-06-01',
//     planEnd: '2025-06-05',
//     actualStart: '',
//     actualEnd: '',
//     status: 'ToDo'
//   }
// ])

// タスク一覧取得
async function fetchTasks() {
  try {
    const response = await axios.get('/api/tasks')
    tasks.value = response.data
  } catch (error) {
    console.error('タスクの取得に失敗しました', error)
  }
}

// タスク保存
async function saveTasks(newTasks) {
  try {
    await axios.post('/api/tasks', newTasks)
    console.log('保存成功')
  } catch (error) {
    console.error('保存失敗', error)
  }
}

// 子コンポーネントから更新されたら反映
function handleUpdate(newTasks) {
  tasks.value = newTasks
  saveTasks(newTasks)  // ← ここで保存処理を呼ぶ！
}

// 初期表示時にデータ取得
onMounted(fetchTasks)

</script>
