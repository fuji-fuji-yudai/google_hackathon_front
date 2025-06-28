<template>
  <div class="reflection-summaries">
    <h2>振り返りサマリー</h2>

    <!-- 年月 Picker -->
    <el-form-item label="年月を選択">
      <el-date-picker
        v-model="selectedYearMonth"
        type="month"
        placeholder="年月を選択してください"
        @change="fetchReflectionSummaries"
      />
    </el-form-item>

    <!-- 振り返りサマリーデータの表示 -->
    <div v-if="summary">
      <div>
        <h3>{{ summary.yearMonth }} の振り返り</h3>
        <p><strong>活動内容:</strong> {{ summary.activitySummary }}</p>
        <p><strong>達成事項:</strong> {{ summary.achievementSummary }}</p>
        <p><strong>改善点:</strong> {{ summary.improvementSummary }}</p>
      </div>
    </div>
    <div v-else>
      <p>選択した年月の振り返りサマリーが見つかりません。</p>
      <el-button type="primary" @click="createSummary" :disabled="!selectedYearMonth">
        サマリーを作成
      </el-button>
    </div>
  </div>
</template>

<script>
import axios from "axios";

// ログインユーザーのトークンを取得
const token = localStorage.getItem('token');

export default {
  data() {
    return {
      summary: null,
      selectedYearMonth: new Date(), // 選択された年月 (例: "2023-10")
    };
  },
  mounted() {
    this.fetchReflectionSummaries(); // ✅ 初期ロード
  },
  methods: {
    async fetchReflectionSummaries() {
      if (!this.selectedYearMonth) {
        console.warn("年月が選択されていません。");
        return;
      }

      try {
        const year = this.selectedYearMonth.getFullYear()
        const month = String(this.selectedYearMonth.getMonth() + 1).padStart(2, '0'); 
        const yearMonth = `${year}-${month}`;
        console.log(yearMonth)
        const response = await axios.get(`https://my-image-14467698004.asia-northeast1.run.app/api/reflection/summarize`, {
          params: {
            yearMonth: yearMonth
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (response.status == 200) {
          this.summary = response.data;
        } else {
          this.summary = null;
        }
      } catch (error) {
        console.error(
          "Reflection summariesの取得に失敗しました:",
          error.response?.data || error.message
        );
      }
    },
    // サマリーを作成する
    async createSummary() {
      if (!this.selectedYearMonth) {
        console.warn("年月が選択されていません。");
        return;
      }
      try {
        const year = this.selectedYearMonth.getFullYear()
        const month = String(this.selectedYearMonth.getMonth() + 1).padStart(2, '0'); 
        const yearMonth = `${year}-${month}`;
        // サマリー作成のAPIリクエスト
        const response = await axios.post(
          `https://my-image-14467698004.asia-northeast1.run.app/api/reflection/summarize`, 
          {
            yearMonth: yearMonth
          },
          {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log("サマリー作成成功:", response.data);
        this.flashMessage = 'サマリー作成が完了しました。'
        this.flashTitle = '成功'
        this.flashType = 'success'
        // サマリー作成後、データを再取得
        this.fetchReflectionSummaries();
      } catch (error) {
        console.error("サマリー作成に失敗しました:", error.response?.data || error.message);
        this.flashMessage = 'サマリーの作成に失敗しました。後ほどお試しください。'
        this.flashTitle = 'エラー'
        this.flashType = 'error'
      }
    },
  },
};
</script>

<style>
.reflection-summaries {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.summary-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #f9f9f9;
}
</style>
