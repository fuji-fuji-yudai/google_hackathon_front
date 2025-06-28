<template>
  <div class="reflection-summaries">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="振り返りサマリー" name="summary">
        <el-scrollbar height="400px">
          <div v-if="summary">
            <h3>{{yearMonth.getFullYear()}}年{{yearMonth.getMonth()+1}}月の振り返り</h3>
            <p><strong>活動内容:</strong> {{ summary.activitySummary }}</p>
            <p><strong>達成事項:</strong> {{ summary.achievementSummary }}</p>
            <p><strong>改善点:</strong> {{ summary.improvementSummary }}</p>
          </div>
          <div v-else>
            <p>{{yearMonth.getFullYear()}}年{{yearMonth.getMonth()+1}}月の振り返りサマリーが見つかりません。</p>
            <el-button type="primary" @click="createSummary">サマリーを作成</el-button>
          </div>
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="着手中のタスク" name="todayTasks">
        <el-scrollbar height="400px">
          <ul>
            <li v-for="task in allTasks" :key="task.id">
              {{ task.title }}
            </li>
          </ul>
          <p v-if="allTasks.length === 0">着手中のタスクはありません。</p>
        </el-scrollbar>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import axios from "axios";

const token = localStorage.getItem('token');

export default {
  props: {
    yearMonth: {
      type: Date,
      required: true,
    },
  },
  data() {
    console.log("yearMonthdouyo: " + this.yearMonth)
    return {
      summary: null,
      activeTab: 'summary',
      allTasks: [],
    };
  },
  computed: {
    todayTasks() {
      const today = new Date();
      return this.allTasks.filter(task => {
        const start = new Date(task.actualStart);
        return start <= today;
      });
    }
  },
  watch: {
    yearMonth: {
      immediate: true,
      handler(newVal) {
        console.log("yearMonth watch 反応:", newVal);
        this.fetchReflectionSummaries(newVal);
      }
    }
  },
  mounted() {
    this.fetchTasks();
  },
  methods: {
    formatDate(date) {
      const d = new Date(date);
      return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    },
    async fetchReflectionSummaries(dateObj) {
      if (!dateObj) return;

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const yearMonth = `${year}-${month}`;

      try {
        const response = await axios.get(`https://my-image-14467698004.asia-northeast1.run.app/api/reflection/summarize`, {
          params: { yearMonth },
          headers: { Authorization: `Bearer ${token}` }
        });
        this.summary = response.status === 200 ? response.data : null;
      } catch (error) {
        console.error("Reflection summariesの取得に失敗:", error.response?.data || error.message);
        this.summary = null;
      }
    },
    async createSummary() {
      const year = this.yearMonth.getFullYear();
      const month = String(this.yearMonth.getMonth() + 1).padStart(2, '0');
      const yearMonth = `${year}-${month}`;

      try {
        await axios.post(
          `https://my-image-14467698004.asia-northeast1.run.app/api/reflection/summarize`,
          { yearMonth },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        this.fetchReflectionSummaries(this.yearMonth);
      } catch (error) {
        console.error("サマリー作成に失敗:", error.response?.data || error.message);
      }
    },
    async fetchTasks() {
      try {
        const response = await fetch('https://my-image-14467698004.asia-northeast1.run.app/api/tasks', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          credentials: 'include',
        });

        if (!response.ok) throw new Error(`取得失敗 status: ${response.status}`);

        const data = await response.json();
        this.allTasks = Array.isArray(data) ? data : [];
        console.log(this.allTasks);
        console.log('todayTasks:', this.todayTasks);
      } catch (error) {
        console.error('タスクの取得に失敗しました', error);
      }
    },
  }
};

// import axios from "axios";

// // ログインユーザーのトークンを取得
// const token = localStorage.getItem('token');

// export default {
//   props: {
//     yearMonth: {
//       type: Date,
//       required: true,
//     },
//   },
//   watch: {
//     yearMonth: {
//       immediate: true,
//       handler(newVal) {
//         this.fetchReflectionSummaries(newVal);
//       }
//     }
//   },
//   data() {
//     return {
//       summary: null,
//     };
//   },
//   methods: {
//     async fetchReflectionSummaries(dateObj) {
//       if (!dateObj) return;

//       const year = dateObj.getFullYear();
//       const month = String(dateObj.getMonth() + 1).padStart(2, '0');
//       const yearMonth = `${year}-${month}`;

//       try {
//         const response = await axios.get(`https://my-image-14467698004.asia-northeast1.run.app/api/reflection/summarize`, {
//           params: {
//             yearMonth: yearMonth
//           },
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         });
//         this.summary = response.status === 200 ? response.data : null;
//       } catch (error) {
//         console.error("Reflection summariesの取得に失敗:", error.response?.data || error.message);
//         this.summary = null;
//       }
//     },

//     async createSummary() {
//       const year = this.yearMonth.getFullYear();
//       const month = String(this.yearMonth.getMonth() + 1).padStart(2, '0');
//       const yearMonth = `${year}-${month}`;

//       try {
//         const response = await axios.post(
//           `https://my-image-14467698004.asia-northeast1.run.app/api/reflection/summarize`,
//           { yearMonth },
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );
//         console.log("サマリー作成成功:", response.data);
//         this.fetchReflectionSummaries(this.yearMonth);
//       } catch (error) {
//         console.error("サマリー作成に失敗:", error.response?.data || error.message);
//       }
//     },
//   },
// };
//   data() {
//     return {
//       summary: null,
//       selectedYearMonth: new Date(), // 選択された年月 (例: "2023-10")
//     };
//   },
//   mounted() {
//     this.fetchReflectionSummaries(); // ✅ 初期ロード
//   },
//   methods: {
//     async fetchReflectionSummaries() {
//       if (!this.selectedYearMonth) {
//         console.warn("年月が選択されていません。");
//         return;
//       }

//       try {
//         const year = this.selectedYearMonth.getFullYear()
//         const month = String(this.selectedYearMonth.getMonth() + 1).padStart(2, '0'); 
//         const yearMonth = `${year}-${month}`;
//         console.log(yearMonth)
//         const response = await axios.get(`https://my-image-14467698004.asia-northeast1.run.app/api/reflection/summarize`, {
//           params: {
//             yearMonth: yearMonth
//           },
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         })
//         if (response.status == 200) {
//           this.summary = response.data;
//         } else {
//           this.summary = null;
//         }
//       } catch (error) {
//         console.error(
//           "Reflection summariesの取得に失敗しました:",
//           error.response?.data || error.message
//         );
//       }
//     },
//     // サマリーを作成する
//     async createSummary() {
//       if (!this.selectedYearMonth) {
//         console.warn("年月が選択されていません。");
//         return;
//       }
//       try {
//         const year = this.selectedYearMonth.getFullYear()
//         const month = String(this.selectedYearMonth.getMonth() + 1).padStart(2, '0'); 
//         const yearMonth = `${year}-${month}`;
//         // サマリー作成のAPIリクエスト
//         const response = await axios.post(
//           `https://my-image-14467698004.asia-northeast1.run.app/api/reflection/summarize`, 
//           {
//             yearMonth: yearMonth
//           },
//           {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         });
//         console.log("サマリー作成成功:", response.data);
//         this.flashMessage = 'サマリー作成が完了しました。'
//         this.flashTitle = '成功'
//         this.flashType = 'success'
//         // サマリー作成後、データを再取得
//         this.fetchReflectionSummaries();
//       } catch (error) {
//         console.error("サマリー作成に失敗しました:", error.response?.data || error.message);
//         this.flashMessage = 'サマリーの作成に失敗しました。後ほどお試しください。'
//         this.flashTitle = 'エラー'
//         this.flashType = 'error'
//       }
//     },
//   },
// };
</script>

<style>
.reflection-summaries {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.summary-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #f9f9f9;
}

.reflection-summaries p {
  text-align: left;
  margin-bottom: 1em;
}

.reflection-summaries p strong {
  display: block;   /* ブロック化して改行させる */
  margin-bottom: 0.25em; /* 見出しと本文の間に少し余白 */
}

li {
  text-align: left;
}
</style>
