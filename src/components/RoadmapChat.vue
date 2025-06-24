<template>
  <div class="roadmap-generator">
    <el-card class="form-card">
      <h2>ロードマップ作製</h2>

      <el-form :model="form" label-width="100px">
        <el-form-item label="対象期間">
          <el-select v-model="form.period" placeholder="期間を選択" style="width: 100%;">
            <el-option label="先月" value="lastMonth" />
            <el-option label="過去3か月" value="last3Months" />
            <el-option label="過去半年" value="last6Months" />
          </el-select>
        </el-form-item>

        <el-form-item label="カテゴリ">
          <el-select v-model="form.category" placeholder="カテゴリを選択" style="width: 100%;">
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

    <!-- モーダルでロードマップ表示 -->
    <el-dialog
      v-model="dialogVisible"
      title="作製されたロードマップ案"
      width="700px"
      top="10vh"
      :close-on-click-modal="false"
    >
      <div class="scrollable-text">
        <pre>{{ roadmapText }}</pre>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">閉じる</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const form = ref({
  period: '',
  category: ''
})

const roadmapText = ref('')
const dialogVisible = ref(false)

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

    const response = await fetch('https://my-image-14467698004.asia-northeast1.run.app/api/reflections/suggest', {
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

    const data = await response.text()
    roadmapText.value = data
    dialogVisible.value = true
  } catch (error) {
    console.error('APIリクエストエラー:', error)
  }
}
</script>

<style scoped>
.roadmap-generator {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px;
  background-color: #f5f7fa;
}

.form-card {
  width: 400px;
  padding: 30px;
}

.scrollable-text {
  max-height: 400px;
  overflow-y: auto;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid #ddd;
}

.ai-chat-modal-content {
  height: auto !important;
}

</style>
