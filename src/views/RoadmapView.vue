<template>
  <div class="roadmap-view">
    <RoadmapManager />
  </div>
</template>

<script>
import RoadmapManager from '../components/RoadmapManager.vue'; // RoadmapManagerをインポート

export default {
  name: 'RoadmapView',
  components: {
    RoadmapManager, // componentsにRoadmapManagerを追加
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