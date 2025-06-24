<template>
  <el-card class="result-card">
    <h3>作製されたロードマップ案</h3>
    <div class="scrollable-text" v-html="htmlContent"></div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  text: {
    type: String,
    required: true
  }
})

// マークダウンをHTMLに変換
const htmlContent = computed(() => marked(props.text))
</script>

<style scoped>
.result-card {
  width: 600px;
  margin-top: 20px;
  padding: 20px;
}

.scrollable-text {
  max-height: 400px;
  overflow-y: auto;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  word-break: break-word;
}

.scrollable-text h1,
.scrollable-text h2,
.scrollable-text h3 {
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.scrollable-text pre {
  background-color: #eee;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
