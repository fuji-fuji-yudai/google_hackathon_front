<template>
  <div>
    <!-- Excel アップローダーコンポーネント追加 -->
    <ExcelUploader @tasks-generated="handleTasksGenerated" />
    <TimelineBoard :tasks="tasks" @update="handleUpdate" />
    <!-- <el-radio-group v-model="viewMode" style="margin-bottom: 20px">
      <el-radio-button label="card">カード</el-radio-button>
      <el-radio-button label="timeline">タイムライン</el-radio-button>
    </el-radio-group>

    <CardBoardView v-if="viewMode === 'card'" :tasks="tasks" @update="handleUpdate" />
    <TimelineBoard v-else :tasks="tasks" @update="handleUpdate" /> -->
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
// import CardBoardView from '@/components/CardBoardView.vue'
import TimelineBoard from '@/components/TimelineBoard.vue'
import ExcelUploader from '@/components/ExcelUploader.vue'

export default {
  components: {
    // CardBoardView,
    TimelineBoard,
    ExcelUploader
  },
  setup() {
    const viewMode = ref('card')
    const tasks = ref([])

    // 他にも、toCamelの修正が必要
    const toCamel = (obj) => {
      const converted = {
        id: obj.id,
        title: obj.title,
        assignee: obj.assignee,
        plan_start: obj.plan_start,
        plan_end: obj.plan_end,
        actual_start: obj.actual_start,
        actual_end: obj.actual_end,
        status: obj.status,
        // ✅ 修正: parent_idの変換ロジック改善
        parentId: obj.parent_id !== null && obj.parent_id !== undefined
          ? parseInt(obj.parent_id)
          : null,
        // ✅ 追加: tmp_idフィールドも保持
        tmpId: obj.tmp_id || null
      }

      return converted
    }

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
      console.log('データ取得開始...')
      if (!token) {
        console.error('トークンが取得できませんでした')
        return false
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
        console.log('=== データ取得成功 ===')
        console.log('取得タスク数:', data.length)

        tasks.value = Array.isArray(data) ? data.map(toCamel) : []

        console.log('=== 変換後データ ===')
        console.log('親タスク:', tasks.value.filter(t => !t.parentId).map(t => t.title))
        console.log('子タスク:', tasks.value.filter(t => t.parentId).map(t => `${t.title} -> 親ID: ${t.parentId}`))

        return true

      } catch (error) {
        console.error('タスクの取得に失敗しました', error)
        return false
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
        console.log('=== 保存開始 ===')
        console.log('保存するタスク数:', payload.length)

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

        console.log('保存成功 - データ再取得開始')

        // ★ 修正: 保存完了後すぐにデータ再取得
        await fetchTasks()

      } catch (error) {
        console.error('タスクの保存に失敗しました', error)
      }
    }

    // 子コンポーネントから更新通知を受けた時
    const handleUpdate = async (newTasks) => {
      console.log('=== handleUpdate 呼び出し ===')
      console.log('更新されたタスク数:', newTasks.length)

      // ★ 修正: 一時的にローカル状態を更新（UX向上のため）
      tasks.value = newTasks

      // 保存処理（完了後に正確なデータで上書き）
      await saveTasks(newTasks)
    }
    // 修正されたhandleTasksGenerated
    const handleTasksGenerated = async (generatedTasks) => {
      console.log('=== Excel からタスク生成完了 ===')
      console.log('生成されたタスク数:', generatedTasks.length)

      // ❌ 削除: 既存タスクとの結合処理
      // const newTasks = [...tasks.value, ...generatedTasks]

      // ❌ 削除: 再保存処理
      // await saveTasks(newTasks)

      // ✅ 追加: データ再取得のみ
      console.log('Excel生成完了 - データ再取得開始')
      await fetchTasks()  // DBから最新データを取得
    }

    onMounted(fetchTasks)

    return {
      viewMode,
      tasks,
      handleUpdate,
      handleTasksGenerated
    }
  }
}
</script>