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
        </el-form-item>
      </el-form>
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
    return {
      form: {
        date: route.query.date || '', // クエリから初期日付を取得
        activity: '',
        achievement: '',
        improvementPoints: ''
      }
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
        const response = await axios.post('https://my-image-14467698004.asia-northeast1.run.app/api/reflection/create',
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}` // Authorization ヘッダーにトークンを設定
            }
          }
        )
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
    }
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