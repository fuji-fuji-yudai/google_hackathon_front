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
import { ref } from 'vue'
import CardBoardView from '@/components/CardBoardView.vue'
import TimelineBoard from '@/components/TimelineBoard.vue'

const viewMode = ref('card')

// 共通のタスクデータ
const tasks = ref([
  {
    id: 'task-1',
    title: '要件定義',
    assignee: '佐藤',
    planStart: '2025-06-01',
    planEnd: '2025-06-05',
    actualStart: '',
    actualEnd: '',
    status: 'ToDo'
  }
])

// 子コンポーネントから更新されたら反映
function handleUpdate(newTasks) {
  tasks.value = newTasks
}
</script>
