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

<script>

</script>

<style>

</style>
