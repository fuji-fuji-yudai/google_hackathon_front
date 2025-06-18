<template>
  <div>
    <FlashMessage
      v-if="flashMessage"
      :message="flashMessage"
      :title="flashTitle"
      :type="flashType"
      :duration="5000"
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
            <span v-if="isDateCompleted(data.date)" style="font-size: 12px; color: green; position: absolute; bottom: 5px;">
              完了
            </span>
          </div>
        </template>
      </el-calendar>
    </el-main>
  </el-container>
</template>

<script setup>
import FlashMessage from '@/components/FlashMessage.vue'
import axios from 'axios';
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// ログインユーザーのトークンを取得
const token = localStorage.getItem('token')

// フラッシュメッセージ用の状態管理
const flashMessage = ref(""); // メッセージ内容
const flashTitle = ref(""); // メッセージのタイトル
const flashType = ref("success"); // メッセージの種類 (success, error, info, warning)
const selectedDate = ref(new Date())
const currentMonth = ref(new Date()) // 現在表示しているカレンダーの月
const completedDates = ref([]) // 完了データの日付リスト

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

// カレンダーを切り替えたときの処理
const fetchReflections = async () => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth() + 1
  try {
    const response = await axios.get('https://my-image-14467698004.asia-northeast1.run.app/api/reflection', {
      params: {
        year: year,
        month: month
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    completedDates.value = response.data.map(reflection => reflection.date)
  } catch (error) {
    console.error('データ取得に失敗:', error)
  }
}
// 日付が完了済みかどうかをチェック
const isDateCompleted = (date) => {
  const formattedDate = date.toISOString().split('T')[0] // YYYY-MM-DD形式に変換
  return completedDates.value.includes(formattedDate)
}
// カレンダーの月が変更されたときにデータを再取得
watch(currentMonth, fetchReflections)
// 初期データ取得
onMounted(fetchReflections)


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