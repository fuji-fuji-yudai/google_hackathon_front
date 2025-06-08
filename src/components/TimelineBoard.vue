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
    <div class="timeline-row" v-for="task in tasks" :key="task.id">
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

<script setup>
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isBetween from 'dayjs/plugin/isBetween'

dayjs.extend(isSameOrBefore)
dayjs.extend(isBetween)

const props = defineProps(['tasks'])

const selectedRange = ref(null)
const dateRange = ref([])
const internalRange = ref(null)

watch(selectedRange, (range) => {
  if (range) {
    const [start, end] = range.map(d => dayjs(d))
    const result = []
    let current = start
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

  if (inActual) return '#67c23a'
  if (inPlan) return '#dcdfe6'
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
