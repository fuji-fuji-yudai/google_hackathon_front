<template>
  <div class="roadmap-view">
    <RoadmapManager /> </div>
</template>

<script>
// import RoadmapBase from '../components/RoadmapBase.vue'; // この行を削除
import RoadmapManager from '../components/RoadmapManager.vue'; // この行を追加

export default {
  name: 'RoadmapView',
  components: {
    // RoadmapBase, // この行を削除
    RoadmapManager, // この行を追加
  },
  // 他のロジック（もしあれば）
};
</script>

<style scoped>
.roadmap-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 20px; /* 必要に応じて調整 */
  box-sizing: border-box;
}
</style>