<template>
  <el-card class="result-card">
    <h3>作製されたロードマップ案</h3>
    <div class="scrollable-text">
      <pre>{{ text }}</pre>
    </div>
  </el-card>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    required: true
  }
})
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
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
