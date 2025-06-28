<template>
  <div class="home">
    <div class="app-title">
      <img src="@/assets/worklooplogo.png" alt="WorkLoop Logo" class="logo-image" />
    </div>
    <div class="feature-grid">
      <div
        v-for="feature in features"
        :key="feature.name"
        class="feature-box"
        @click="goTo(feature.route)"
      >
        <img :src="feature.image" :alt="feature.name" class="feature-image" />
        <div class="feature-title">{{ feature.title }}</div>
      </div>
    </div>
  </div>
</template>


<script>
export default {
  name: "HomeView",
  data() {
    return {
      features: [
        {
          name: "chat",
          title: "チャットへ",
          image: require("@/assets/chat.png"),
          route: "/chat",
        },
        {
          name: "task",
          title: "タスク管理へ",
          image: require("@/assets/taskManage.png"),
          route: "/taskManage",
        },

        {
          name: "roadmap",
          title: "ロードマップへ",
          image: require("@/assets/roadmapimg.png"),
          route: "/roadmap",
        },

        {
          name: "reflection",
          title: "振り返りへ",
          image: require("@/assets/logo.png"),
          route: "/reflection/home",
        }
        
      ],
    };
  },
  methods: {
    goTo(route) {
      this.$router.push(route);
    },
  },
};
</script>

<style scoped>
.home {
  padding: 1rem 1rem;
  background: linear-gradient(to bottom right, #f0f2f5, #e6ebf1);
  /* min-height: 100vh; */
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
}

/* アプリタイトル */
.app-title {
  text-align: center;
  margin: 0rem 0 1rem;
  animation: fadeIn 1s ease-in-out;
  animation-fill-mode: both;

.logo-image {
    height: auto; 
    max-width: 300px;
    object-fit: contain;
  }
}


/* グリッドレイアウト */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 常に2列 */
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .feature-grid {
    grid-template-columns: 1fr; /* スマホなどでは1列に */
  }
}

/* 各機能ボックス */
.feature-box {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem 1.5rem;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  border: 1px solid #dfe4ea;
}

.feature-box:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
}

/* タイトルテキスト */
.feature-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  margin-top: 1rem;
}

/* 画像サイズとアニメーション */
.feature-image {
  height: 160px;
  max-width: 100%;
  object-fit: contain;
  margin: 0 auto;
  transition: transform 0.3s ease;
}

.feature-box:hover .feature-image {
  transform: scale(1.05);
}

/* フェードインアニメーション */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
