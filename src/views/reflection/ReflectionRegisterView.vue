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
      // 登録処理
      try {
        console.log(this.form)
        const token = localStorage.getItem('token')
        const response = await axios.post('https://my-image-14467698004.asia-northeast1.run.app/api/reflection/create',
          this.form,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Authorization ヘッダーにトークンを設定
            },
          }
        )
        alert('登録成功！')
        console.log('レスポンス:', response.data)
      } catch (error) {
        console.error('登録失敗:', error)
        alert('登録に失敗しました。')
      }
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