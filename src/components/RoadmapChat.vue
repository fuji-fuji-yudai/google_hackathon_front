<template>
  <div class="roadmap-generator">
    <el-card class="form-card">
      <h2>ロードマップ作製</h2>

      <el-form :model="form" label-width="100px">
        <el-form-item label="対象期間">
          <el-select v-model="form.period" placeholder="期間を選択">
            <el-option label="先月" value="lastMonth" />
            <el-option label="過去3か月" value="last3Months" />
            <el-option label="過去半年" value="last6Months" />
          </el-select>
        </el-form-item>

        <el-form-item label="カテゴリ">
          <el-select v-model="form.category" placeholder="カテゴリを選択">
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="generateRoadmap">
            ロードマップ作製案出力
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ロードマップ出力表示 -->
    <el-card v-if="roadmapText" class="result-card">
      <h3>作製されたロードマップ案</h3>
      <p style="white-space: pre-wrap;">{{ roadmapText }}</p>
    </el-card>
  </div>
</template>


<script setup>
import { ref } from 'vue'

// フォームデータ
const form = ref({
  period: '',
  category: ''
})

const roadmapText = ref('') 

// 仮のカテゴリデータ（将来的にDBから取得予定）
const categoryOptions = [
  { label: '技術', value: 'technology' },
  { label: '昇進', value: 'promotion' },
  { label: 'プロジェクトマネジメント', value: 'management' },
  { label: '人事', value: 'hr' },
  { label: '企画', value: 'planning' }
]


const generateRoadmap = async () => {
  try {
    const token = localStorage.getItem('token')
    const selectedCategory = categoryOptions.find(
      option => option.value === form.value.category
    )
    const categoryLabel = selectedCategory ? selectedCategory.label : ''

    const response = await fetch('https://your-backend-api.com/api/roadmap/suggest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        period: form.value.period,
        category: categoryLabel
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    
const data = await response.text() // ← 文章が返ってくる前提
 console.log('生成されたロードマップ案:', data)

 // 画面に表示（例：refでバインドした変数にセット）
  roadmapText.value = data

  } catch (error) {
    console.error('APIリクエストエラー:', error)
  }
}


</script>

<style scoped>
.roadmap-generator {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.form-card {
  width: 400px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.result-card {
  margin-top: 20px;
  width: 600px;
  white-space: pre-wrap;
}

</style>