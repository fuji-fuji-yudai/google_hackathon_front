<template>
  <el-container>
    <el-aside>
      <el-calendar class="side-calendar">
        <template #date-cell="{ data }">
          <div
            style="width: 100%; height: 100%; cursor: pointer; display: flex; justify-content: center;"
            @click="handleDateClick(data.date)"
          >
            {{ data.date.getDate() }}
          </div>
        </template>
      </el-calendar>
    </el-aside>
    <el-main>
      <el-calendar class="main-calendar">
        <template #date-cell="{ data }">
          <div
            style="width: 100%; height: 100%; cursor: pointer; display: flex; justify-content: center;"
            @click="handleDateClick(data.date)"
          >
            {{ data.date.getDate() }}
          </div>
        </template>
      </el-calendar>
    </el-main>
  </el-container>
</template>

<script>
import { ref } from 'vue'

import { useRouter } from 'vue-router'

export default {
  setup() {
    const selectedDate = ref(new Date())

    const router = useRouter()

    const handleDateClick = (date) => {
      console.log('クリックされた日付:', date)
      selectedDate.value = date
      router.push({
        name: 'reflectionRegister',
        query: { date: date }
      })
    }

    return {
      handleDateClick,
      selectedDate,
    }
  },
}
</script>

<style>
  .side-calendar {
    aspect-ratio: 1/1 !important;
    width: 100%;
    border: 1px solid red;
  }
</style>