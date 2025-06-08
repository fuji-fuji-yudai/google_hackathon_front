<!-- ユーザー操作（クリックなど）
　↓
ref の値が変わる
　↓
watch が検知する
　↓
必要な処理を実行（dateRangeの更新など）
　↓
template も自動で再描画 -->
<template>
  <div class="timeline-container">
    <el-date-picker
      v-model="internalRange"
      type="daterange"
      start-placeholder="開始日"
      end-placeholder="終了日"
      format="YYYY-MM-DD"
      value-format="YYYY-MM-DD"
      @change="handleDateRangeChange"
    />

    <!-- ヘッダー（日付） -->
    <div class="timeline-header">
      <div class="label">作業項目 / 担当 / 予定 / 実績</div>
      <div class="days">
        <div v-for="date in dateRange" :key="date" class="day">
          {{ date.slice(5) }}
        </div>
      </div>
    </div>

    <!-- 各タスク行 -->
    <div
      class="timeline-row"
      v-for="task in tasks"
      :key="task.id"
    >
      <div class="label">
        <strong>{{ task.title }}</strong>
        {{ task.assignee }}
        予定: {{ task.planStart }} ~ {{ task.planEnd }}
        実績: {{ task.actualStart }} ~ {{ task.actualEnd }}
      </div>

      <div class="days">
        <div
          v-for="date in dateRange"
          :key="date"
          class="day"
          :style="{ backgroundColor: getDayColor(date, task) }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// watchはVueにおいてウォッチャーを作成するVueのAPIです。これにより、指定したデータソースの変更を監視し、変更があった際にコールバック関数を実行します。
// refはref()は、「ある値」をリアクティブに管理するためのVueの機能。値が変わったら自動的に画面（template）も再描画されます。
// ref は「データの箱」 watch は「箱の中身が変わったときの反応装置」
// refを使って定義した値（今回だと、selectedRangeとdateRange）はリアクティブ（画面操作に対して反応する）な値として定義される。
// それにより、画面操作によってリアクティブな値が自動更新される。
// watchでは、リアクティブな値を監視し、値に応じた処理を定義する。
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isBetween from 'dayjs/plugin/isBetween'
import { Task } from '../types/task'

dayjs.extend(isSameOrBefore)
dayjs.extend(isBetween)

const { tasks } = defineProps<{ tasks: Task[] }>()


// リアクティブ（画面操作に反応して値が代わる）な変数として定義
const selectedRange = ref<[Date, Date] | null>(null)
const dateRange = ref<string[]>([])
const internalRange = ref<[string, string] | null>(null)

// 日付範囲の変更を監視して dateRange を更新
watch(selectedRange, (range) => {
  if (range) {  // nullでなければ処理続行
    // range = [Date型, Date型] を dayjs オブジェクトに変換
    // dayjs() にすることで .add(), .isSameOrBefore() などが使える
    const [start, end] = range.map(d => dayjs(d))
    const result = []
    let current = start
    // start から end までの 日付文字列配列を作るループ
    // 毎日1日ずつ進めて、YYYY-MM-DD 形式の文字列にして result に追加
    while (current.isSameOrBefore(end)) {
      result.push(current.format('YYYY-MM-DD'))
      current = current.add(1, 'day')
    }
    dateRange.value = result
  } else {
    dateRange.value = []
  }
})

function handleDateRangeChange() {
  if (internalRange.value) {
    const [start, end] = internalRange.value
    selectedRange.value = [new Date(start), new Date(end)]
  } else {
    selectedRange.value = null
  }
}
// 日付に応じたセルの色を決定
function getDayColor(dateStr, task) {
  const date = dayjs(dateStr)

  const inActual =
    task.actualStart &&
    task.actualEnd &&
    date.isBetween(dayjs(task.actualStart), dayjs(task.actualEnd), null, '[]')

  const inPlan =
    task.planStart &&
    task.planEnd &&
    date.isBetween(dayjs(task.planStart), dayjs(task.planEnd), null, '[]')

  if (inActual) return '#67c23a' // 緑（実績）
  if (inPlan) return '#dcdfe6' // グレー（予定）
  return ''
}

</script>

<style scoped>
.timeline-container {
  font-size: 12px;
}
.timeline-header,
.timeline-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.label {
  width: 500px;
  padding-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.days {
  display: flex;
}
.day {
  width: 28px;
  height: 20px;
  border: 1px solid #eee;
  text-align: center;
  font-size: 10px;
  line-height: 20px;
}
</style>
