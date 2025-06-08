<template>
    <div>
        <div class="board">
            <!-- statuses（ToDo, Doing, Done）をループして、各ステータスの列を表示 -->
            <div v-for="status in statuses" :key="status" class="list">
                <h3>{{ status }}</h3>
                <!-- vuedraggable ライブラリを使って、ドラッグ＆ドロップ機能を実装 -->
                <!-- 各列（ToDo, Doing, Done）の中のタスクは taskByStatus[status] で取得 -->
                <draggable v-model="taskByStatus[status]" group="cards" @end="onDragEnd" class="card-list">
                    <!-- 各タスクは Element Plus の el-card コンポーネントで表示（タイトルと予定日付） -->
                    <template #item="{ element }">
                        <el-card class="card">
                            <div>{{ element.title }}</div>
                            <small>予定：{{ element.planStart }} ~ {{ element.planEnd }}</small>
                        </el-card>
                    </template>
                </draggable>
            </div>
        </div>
        <div class="task-input">
            <el-input v-model="newTitle" placeholder="タスク名を入力" class="input" />
            <el-date-picker v-model="newDates" type="daterange" range-separator="〜" start-placeholder="開始日"
                end-placeholder="終了日" class="input" />
            <el-button type="primary" @click="addTask">追加</el-button>
        </div>
    </div>
</template>

<script>
import { ref, computed } from 'vue'
import draggable from 'vuedraggable'
import { format } from 'date-fns'

export default {
    // 親コンポーネントから tasks 配列（タスク一覧）を受け取る
    // update イベントを使って、タスクの更新情報を親に返す
    props: {
        tasks: {
            type: Array,
            required: true
        }
    },
    emits: ['update'],
    components: {
        draggable
    },
    setup(props, { emit }) {
        // タスクのステータスを定義
        const statuses = ['ToDo', 'Doing', 'Done']

        // ステータスごとに分類
        const taskByStatus = computed(() =>
            Object.fromEntries(
                statuses.map(s => [s, props.tasks.filter(t => t.status === s)])
            )
        )
        // タスクのタイトル（文字列）、予定開始日と終了日を保持するリアクティブ変数
        const newTitle = ref('')
        const newDates = ref([])
        const formatdate = format
        // タスクを追加する関数
        function addTask() {
            // タイトルが空、または日付が2つ選択されていない場合は何もしない（バリデーション）
            if (!newTitle.value || newDates.value.length !== 2) return

            // 新しいタスクオブジェクトを作成
            const newTask = {
                title: newTitle.value,  // 入力されたタイトル
                planStart: formatdate(newDates.value[0], 'yyyy/M/d'),      // 選択された開始日（formatでyyyy/mm/ddに修正）
                planEnd: formatdate(newDates.value[1], 'yyyy/M/d'),      // 選択された開始日（formatでyyyy/mm/ddに修正）
                status: 'ToDo'  // 初期状態は必ず "ToDo"
                // → "2025/6/12"
            }

            // 既存の tasks に新しいタスクを追加した新配列を作成
            const updated = [...props.tasks, newTask]
            // 親コンポーネントに更新されたタスクリストを emit で通知
            emit('update', updated)

            // 入力フィールドをリセット（次の入力のため）
            newTitle.value = ''
            newDates.value = []
        }
        // タスクをドラッグ＆ドロップした後、現在の順序とステータスで再構築したtasks配列を作成し、親に渡す
        function onDragEnd() {
            // 全タスクをまとめ直して親に渡す
            const updated = statuses.flatMap(status =>
                taskByStatus.value[status].map(t => ({ ...t, status }))
            )
            emit('update', updated)
        }

        return {
            statuses,
            taskByStatus,
            onDragEnd,
            newTitle,
            newDates,
            addTask,
        }
    }
}
</script>

<style scoped>
.board {
    display: flex;
    gap: 16px;
}

.list {
    background: #f4f4f4;
    padding: 10px;
    width: 250px;
    border-radius: 8px;
}

.card-list {
    min-height: 100px;
}

.card {
    margin-bottom: 8px;
}
</style>
