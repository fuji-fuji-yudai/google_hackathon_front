<template>
  <div class="form-wrapper">
    <el-main>
      <h2>振り返り</h2>
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
          <el-button type="primary" @click="create">
            保存
          </el-button>
          <el-button type="secondary" @click="clear">
            クリア
          </el-button>
          <!-- フィードバックボタン -->
          <el-button v-if="isFeedbackVisible" type="success" @click="giveFeedback">
            フィードバック作成
          </el-button>
        </el-form-item>
      </el-form>
      <!-- フィードバック結果表示 -->
      <div v-if="feedback">
        <h3>生成されたフィードバック</h3>
        <p>{{ feedbackData.feedback }}</p>
      </div>
    </el-main>
  </div>
</template>

<script>
import { useRoute } from 'vue-router'
import axios from 'axios'

// ログインユーザーのトークンを取得
const token = localStorage.getItem('token')

export default {
  data() {
    const route = useRoute()
    // クエリからデータを取得
    const reflectionData = route.query.reflection ? JSON.parse(route.query.reflection) : null;
    console.log("reflectionData: " + reflectionData);
    return {
      id: route.query.id || null, // 主キーID（更新時に使用）
      form: {
        date: route.query.date || '', // クエリから初期日付を取得
        activity: reflectionData ? reflectionData.activity : '',
        achievement: reflectionData ? reflectionData.achievement : '',
        improvementPoints: reflectionData ? reflectionData.improvementPoints : '',
      },
      isFeedbackVisible: !!reflectionData, // reflectionデータが存在する場合にフィードバックボタンを表示
      feedbackData: null, // 生成されたフィードバックを格納する
      error: null, // エラーメッセージ
    };
  },

  mounted() {
    // Reflection IDが存在する場合のみ getFeedback を実行
    if (this.id) {
      this.getFeedback();
    }
  },
  
  methods: {
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
      // 登録処理
      try {
        console.log(payload)
        let response;
        if (this.id) {
          // 更新処理
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
              message: "登録に成功しました。",
              title: "成功",
              type: "success",
            },
          });
        } else {
          router.push({
            name: "reflectionHome",
            query: {
              message: "登録に失敗しました。",
              title: "エラー",
              type: "error",
            },
          });
        }
        console.log('レスポンス:', response.data)
      } catch (error) {
        console.error('登録失敗:', error)
        router.push({
          name: "reflectionHome",
          query: {
            message: "登録に失敗しました。",
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
      console.log(this.reflectionData)
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
          alert("成功")
        }
      } catch (error) {
        console.error('フィードバック生成に失敗:', error);
        alert('フィードバックを生成できませんでした。後ほど再試行してください。');
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
  }
}
</script>

<style>
  main {
    border-radius: 5px;
    border: solid 1px rgb(210, 210, 210);
    width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
</style>