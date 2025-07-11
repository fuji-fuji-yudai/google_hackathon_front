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
    <el-main>
      <!-- 右上に表示するボタン -->
      <div class="toggle-btn top-right vertical-text-btn">
        <el-button @click="isSummaryVisible = !isSummaryVisible">
          <el-icon>
            <component :is="isSummaryVisible ? ArrowRightBold : ArrowLeftBold" />
          </el-icon>
        </el-button>
      </div>
      <el-calendar class="main-calendar" v-model="calendarDate">
        <template #date-cell="{ data }">
          <div
            style="width: 100%; height: 100%; cursor: pointer; display: flex; flex-direction: column;"
            @click="handleDateClick(data.date)"
          >
            <span>{{ data.date.getDate() }}</span>
            <el-tag v-if="isDateCompleted(data.date)" type="success">完了</el-tag>
          </div>
        </template>
      </el-calendar>
    </el-main>
    <!-- サマリーをスライドで表示 -->
    <transition name="slide">
      <div class="summary-panel" v-if="isSummaryVisible">
        <ReflectionSummary :yearMonth="currentMonth" />
      </div>
    </transition>
  </el-container>
</template>

<script setup>
import { ArrowLeftBold, ArrowRightBold } from '@element-plus/icons-vue'
import FlashMessage from '@/components/FlashMessage.vue'
import ReflectionSummary from '@/components/ReflectionSummary.vue';
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
const isSummaryVisible = ref(false);
const calendarDate = ref(new Date());

// ここでフラッシュメッセージを設定
const route = useRoute()
flashMessage.value = route.query.message;
flashTitle.value = route.query.title;
flashType.value = route.query.type;

const router = useRouter()

const handleDateClick = (date) => {
  console.log('クリックされた日付:', date)
  selectedDate.value = date
  // ローカルタイムゾーンで日付をフォーマット
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 月は0から始まるため +1
  const day = String(date.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  // データを登録画面に渡す
  router.push({
    name: 'reflectionRegister',
    query: {
      date: formattedDate,
    },
  });
}

// カレンダーを切り替えたときの処理
const fetchReflections = async () => {
  console.log('取得処理開始')
  console.log('currentMonth' + currentMonth.value)
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth() + 1
  console.log('year：' + year)
  console.log('month：' + month)
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
    console.log('レスポンスデータ：' + response.data)
    completedDates.value = response.data.map(reflection => {return new Date(Number(reflection.date)).toDateString();})

  } catch (error) {
    console.error('データ取得に失敗:', error)
  }
}
// 日付が完了済みかどうかをチェック
const isDateCompleted = (date) => {
  // ローカルタイムゾーンで日付をフォーマット
  // const year = date.getFullYear();
  // const month = String(date.getMonth() + 1).padStart(2, '0'); // 月は0から始まるため +1
  // const day = String(date.getDate()).padStart(2, '0');
  // const formattedDate = `${year}-${month}-${day}`;
  const target = new Date(date).toDateString();
  // console.log('formattedDate：' + formattedDate)
  return completedDates.value.includes(target)
}

let previousMonth = calendarDate.value.getMonth();

watch(calendarDate, (newDate) => {
  const newMonth = newDate.getMonth();
  if (newMonth !== previousMonth) {
    previousMonth = newMonth;
    currentMonth.value = new Date(newDate); // 月が変わったので反映
    console.log('カレンダーの月が変更された:', newDate);
  }
});

// カレンダーの月が変更されたときにデータを再取得
watch(currentMonth, fetchReflections)
// 初期データ取得
onMounted(fetchReflections)

// const onMonthChange = (date) => {
//   currentMonth.value = date
//   console.log('カレンダーの月が変更された:', date)
// }


</script>

<style>
  .date-cell {
    width: 100%;
    height: 100%;
    cursor: pointer;
    display: flex;
    flex-direction: column; /* 縦方向に配置 */
    justify-content: center;
    align-items: center;
    position: relative;
  }
  .completed-label {
    font-size: 12px;
    color: green;
    margin-top: 5px; /* 日付の下に余白をつける */
  }
  /* トグルボタンの右上配置 */
.toggle-btn.top-right {
  position: fixed;
  top: 75px;
  right: 0px;
  z-index: 1000;
}


/* サマリーのスライド表示 */
.summary-panel {
  position: fixed;
  top: 75px;
  right: 0;
  width: 350px;
  height: 100vh;
  background-color: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  z-index: 999;
  padding: 20px;
}

/* スライド用のトランジション */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
.slide-enter-to,
.slide-leave-from {
  transform: translateX(0%);
}
.calendar-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
</style>