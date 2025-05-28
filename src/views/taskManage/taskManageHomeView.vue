<template>
  <SidebarLayout>
    <div class="home">
      <el-calendar v-model="value" />
    </div>
  </SidebarLayout>
</template>

<script setup>
import SidebarLayout from '@/components/SidebarLayout.vue';
import { ref } from 'vue'
const value = ref(new Date())
</script>
