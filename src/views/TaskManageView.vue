<template>
  <div>
    <el-radio-group
      v-model="viewMode"
      style="margin-bottom: 20px"
    >
      <el-radio-button label="card">カード</el-radio-button>
      <el-radio-button label="timeline">タイムライン</el-radio-button>
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

<script>
import { ref, onMounted } from 'vue'
import CardBoardView from '@/components/CardBoardView.vue'
import TimelineBoard from '@/components/TimelineBoard.vue'

export default {
  components: {
    CardBoardView,
    TimelineBoard
  },
  setup() {
    const viewMode = ref('card')
    const tasks = ref([])

    // snake_case → camelCase に変換
    const toCamel = (obj) => ({
      id: obj.id,
      title: obj.title,
      assignee: obj.assignee,
      plan_start: obj.plan_start,
      plan_end: obj.plan_end,
      actual_start: obj.actual_start,
      actual_end: obj.actual_end,
      status: obj.status,
      parentId: obj.parent_id ?? null
    })

    // camelCase → snake_case に変換
    const toSnake = (obj) => ({
      id: obj.id,
      title: obj.title,
      assignee: obj.assignee,
      plan_start: obj.plan_start,
      plan_end: obj.plan_end,
      actual_start: obj.actual_start,
      actual_end: obj.actual_end,
      status: obj.status,
      parent_id: obj.parentId ?? null
    })

    // タスク一覧取得
    const fetchTasks = async () => {
      const token = localStorage.getItem('token')
      console.log('トークン:', token)
      if (!token) {
        console.error('トークンが取得できませんでした')
        return
      }

      try {
        const response = await fetch('https://my-image-14467698004.asia-northeast1.run.app/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`取得失敗 status: ${response.status}`)
        }

        const data = await response.json()
        console.log('取得成功:', data)

        tasks.value = Array.isArray(data) ? data.map(toCamel) : []
      } catch (error) {
        console.error('タスクの取得に失敗しました', error)
        console.log(JSON.stringify(JSON.parse(atob(token.split('.')[1])), null, 2))
      }
    }

    // タスク保存
    const saveTasks = async (newTasks) => {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('トークンが取得できませんでした')
        return
      }

      try {
        const payload = newTasks.map(toSnake)

        const response = await fetch('https://my-image-14467698004.asia-northeast1.run.app/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`保存失敗 status: ${response.status}`)
        }

        console.log('保存成功')
      } catch (error) {
        console.error('タスクの保存に失敗しました', error)
      }
    }

    // 子コンポーネントから更新通知を受けた時
    const handleUpdate = (newTasks) => {
      tasks.value = newTasks
      saveTasks(newTasks)
    }

    onMounted(fetchTasks)

    return {
      viewMode,
      tasks,
      handleUpdate
    }
  }
}
</script>
