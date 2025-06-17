<template>
  <div>
    <FlashMessage
      v-if="flashMessage"
      :message="flashMessage"
      :title="flashTitle"
      :type="flashType"
      :duration="3000"
    />
  </div>
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

<script setup>
import FlashMessage from '@/components/FlashMessage.vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// フラッシュメッセージ用の状態管理
const flashMessage = ref(""); // メッセージ内容
const flashTitle = ref(""); // メッセージのタイトル
const flashType = ref("success"); // メッセージの種類 (success, error, info, warning)
const selectedDate = ref(new Date())
// ここでフラッシュメッセージを設定
const route = useRoute()
flashMessage.value = route.query.message;
flashTitle.value = route.query.title;
flashType.value = route.query.type;

const router = useRouter()

const handleDateClick = (date) => {
  console.log('クリックされた日付:', date)
  selectedDate.value = date
  router.push({
    name: 'reflectionRegister',
    query: { date: date }
  })
}

</script>

<style>
  .el-alert {
  margin: 20px 0 0;
  }
  .el-alert:first-child {
    margin: 0;
  }
  .side-calendar {
    aspect-ratio: 1/1 !important;
    width: 100%;
    border: 1px solid red;
  }
</style>