<template>
  <div class="form-wrapper">
    <FlashMessage
      v-if="flashMessage"
      :message="flashMessage"
      :title="flashTitle"
      :type="flashType"
      :duration="5000"
    />
    <el-main>
      <h2>振り返り</h2>
      <!-- 右上に表示するボタン -->
      <div class="toggle-btn top-right vertical-text-btn">
        <el-button @click="isSummaryVisible = !isSummaryVisible">
          <el-icon>
            <component :is="isSummaryVisible ? ArrowRightBold : ArrowLeftBold" />
          </el-icon>
        </el-button>
      </div>
      <el-form label-width="80px">
        <el-form-item label="日付">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="日付を入力してください。"
            :size="size"
          />
        </el-form-item>
        <el-form-item label="活動内容">
          <el-input 
            v-model="form.activity" 
            type="textarea" 
            :rows="5"
            placeholder="活動内容"
          />
        </el-form-item>
        <el-form-item label="達成事項">
          <el-input 
            v-model="form.achievement"
            type="textarea" 
            :rows="5"
            placeholder="達成事項"
          />
        </el-form-item>
        <el-form-item label="改善点">
          <el-input 
            v-model="form.improvementPoints" 
            :rows="5"
            type="textarea" 
            placeholder="改善点"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :disabled="feedbackData !== null" @click="create">
            保存
          </el-button>
          <el-button type="secondary" @click="clear">
            クリア
          </el-button>
          <!-- フィードバックボタン -->
          <el-button v-if="isFeedbackButtonVisible" type="success" :disabled="feedbackData !== null" @click="giveFeedback">
            {{ feedbackData !== null ? "フィードバック作成済み" : "フィードバック作成" }}
          </el-button>
        </el-form-item>
      </el-form>
      <!-- フィードバック結果表示 -->
      <div v-if="feedbackData" class="feedback-container">
        <h2>AIによるフィードバック</h2>
        <!-- マークダウンをHTMLとしてレンダリング -->
        <div v-html="renderMarkdown(feedbackData.feedback)" class="feedback"></div>
      </div>
    </el-main>
    <!-- サマリーをスライドで表示 -->
    <transition name="slide">
      <div class="summary-panel" v-if="isSummaryVisible">
        <ReflectionSummary :yearMonth="currentMonth" />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ArrowLeftBold, ArrowRightBold } from '@element-plus/icons-vue';
import ReflectionSummary from '@/components/ReflectionSummary.vue';
import FlashMessage from '@/components/FlashMessage.vue'
</script>
<script>
import { useRoute } from 'vue-router'
import axios from 'axios'
import { marked } from 'marked'; // マークダウンライブラリをインポート
import { ref } from 'vue'

// ログインユーザーのトークンを取得
const token = localStorage.getItem('token')

export default {
  data() {
    const route = useRoute()
    return {
      id: null,
      form: {
        date: route.query.date || '',
        activity: '',
        achievement: '',
        improvementPoints: '',
      },
      isFeedbackButtonVisible: false,
      feedbackData: null,
      error: null,
      // フラッシュメッセージ用の状態管理
      flashMessage: ref(""), // メッセージ内容
      flashTitle: ref(""), // メッセージのタイトル
      flashType: ref("success"), // メッセージの種類 (success, error, info, warning)
      isSummaryVisible: ref(false),
      currentMonth: new Date(route.query.date) || '',
    };
  },

  mounted() {
    this.fetchReflections().then((data) => {
      console.log(this.form.date);
      if (data) {
        this.id = data.id;
        this.form.activity = data.activity;
        this.form.achievement = data.achievement;
        this.form.improvementPoints = data.improvementPoints;
        this.isFeedbackButtonVisible = true;
        this.reflectionData = data;
        this.getFeedback();
      }
    }).catch((error) => {
      console.error("Reflectionデータの取得に失敗:", error);
    });
  },
  
  methods: {
    async fetchReflections() {
      console.log('取得処理開始')
      const route = useRoute()
      const date = route.query.date;
      console.log(date)
      try {
        const response = await axios.get(`https://my-image-14467698004.asia-northeast1.run.app/api/reflection/${date}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        console.log('レスポンスデータ：' + response.data)
        if (response.status == 200) {
          return response.data;
        } else {
          return null
        }
      } catch (error) {
        console.error('データ取得に失敗:', error)
        return null
      }
    },
    async create() {
      const router = this.$router
      console.log('JWT トークン:', token);
      // トークンが存在しない場合のエラーハンドリング
      if (!token) {
        console.error('JWT トークンが存在しません');
        alert('ログインが必要です');
        return; // 処理を中断
      }
      // 日付をISO 8601形式（YYYY-MM-DD）に変換
      const formattedDate = this.form.date
        ? new Date(this.form.date).toISOString().split("T")[0] // フォーマット例: "2025-06-18"
        : "";
      // フォームデータを送信
      const payload = {
        ...this.form,
        date: formattedDate, // 変換された日付を送信
      };
      // 処理種別を定義
      let shoriType;
      // 登録・更新処理
      try {
        console.log(payload)
        let response;
        if (this.id) {
          // 更新処理
          shoriType = '更新';
          response = await axios.put(
            `https://my-image-14467698004.asia-northeast1.run.app/api/reflection/update/${this.id}`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${token}`, // Authorization ヘッダーにトークンを設定
              },
            }
          );
        } else {
          // 登録処理
          shoriType = '登録';
          response = await axios.post(
            'https://my-image-14467698004.asia-northeast1.run.app/api/reflection/create',
            payload,
            {
              headers: {
                Authorization: `Bearer ${token}`, // Authorization ヘッダーにトークンを設定
              },
            }
          );
        }
        if(response.status === 200) {
          // フラッシュメッセージを設定してリダイレクト
          router.push({
            name: "reflectionHome",
            query: {
              message: `${shoriType}に成功しました。`,
              title: "成功",
              type: "success",
            },
          });
        } else {
          router.push({
            name: "reflectionHome",
            query: {
              message: `${shoriType}に失敗しました。`,
              title: "エラー",
              type: "error",
            },
          });
        }
        console.log('レスポンス:', response.data)
      } catch (error) {
        console.error(`${shoriType}失敗:`, error)
        router.push({
          name: "reflectionHome",
          query: {
            message: `${shoriType}に失敗しました。`,
            title: "エラー",
            type: "error",
          },
        });
      }
    },
    clear() {
      // フォームをリセット
      this.form.date = '';
      this.form.activity = '';
      this.form.achievement = '';
      this.form.improvementPoints = '';
    },
    async giveFeedback() {
      try {
        const response = await axios.post(
          'https://my-image-14467698004.asia-northeast1.run.app/api/feedback/create',
          this.reflectionData,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Authorization ヘッダーにトークンを設定
            },
          }
        );
        if(response.status === 200) {
          this.getFeedback();
          this.flashMessage = 'フィードバックの作成が完了しました。'
          this.flashTitle = '成功'
          this.flashType = 'success'
        }
      } catch (error) {
        console.error('フィードバック生成に失敗:', error);
        this.flashMessage = 'フィードバックの作成に失敗しました。後ほどお試しください。'
        this.flashTitle = 'エラー'
        this.flashType = 'error'
      }
    },
    async getFeedback() {
      try {
        // APIを呼び出してフィードバックを取得
        const response = await axios.get(
          "https://my-image-14467698004.asia-northeast1.run.app/api/feedback", {
          params: { reflectionId: this.reflectionData.id },
          headers: {
            Authorization: `Bearer ${token}`, // Authorization ヘッダーにトークンを設定
          },
        });
        this.feedbackData = response.data; // フィードバックを格納
        if (this.feedbackData.feedback == null) {
          this.feedbackData = null;
        }
        console.log("フィードバック取得成功");
        this.error = null; // エラーをリセット
      } catch (error) {
        // エラーが発生した場合
        console.error("フィードバック取得に失敗:", error);
        if (error.response && error.response.status === 404) {
          this.error = "指定されたReflection IDに対応するフィードバックが見つかりません。";
        } else {
          this.error = "フィードバック取得中にエラーが発生しました。";
        }
        this.feedbackData = null; // フィードバックをリセット
      }
    },
    // マークダウンをHTMLとしてレンダリング
    renderMarkdown(markdownText) {
      return marked(markdownText);
    },
  }
}
</script>

<style>
  .form-wrapper {
    background: linear-gradient(to bottom right, #f0f2f5, #e6ebf1);
  }
  main {
    margin: 20px 0px;
    border-radius: 10px;
    border: solid 1px rgb(210, 210, 210);
    width: 800px;
    margin-left: auto;
    margin-right: auto;
    background-color: white;
  }
  .feedback-container {
    margin-top: 10px;
    padding-top: 10px;
    border-top: solid 1px rgb(210, 210, 210);
  }
  .feedback {
    text-align: left;
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
</style>