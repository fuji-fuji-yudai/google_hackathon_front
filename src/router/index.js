import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import chatRoutes from './routes/chat'
import reflectionRoutes from './routes/reflection'
import Login from '../views/LoginView.vue'
import roadmapRoutes from './routes/roadmap'
import taskManageRoutes from './routes/taskManage'
import reminderRoutes from './routes/reminder'
import { ElMessage } from 'element-plus'; // ElMessage をインポート

const REMINDER_API_URL = 'https://my-image-14467698004.asia-northeast1.run.app/api/reminders';

const routes = [
  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true } 
  },
  { path: '/', component: Login },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  },
  ...chatRoutes,
  ...reflectionRoutes,
  ...roadmapRoutes,
  ...taskManageRoutes,
  ...reminderRoutes,

   {
    // このパスは、Google Cloud Console に設定した承認済みリダイレクト URI (フロントエンド側) と
    // バックエンドの ReminderController で生成する redirectUrl のパス部分と一致させる必要があります。
    // 例: https://your-frontend-domain.com/oauth2/callback/google-login
    path: '/oauth2/callback/google-login',
    name: 'GoogleAuthCallback',
    component: {
      template: `
        <div class="google-auth-callback-container">
          <p>Google認証処理中...</p>
          <p>完了までしばらくお待ちください。</p>
          </div>
      `,
      // コンポーネントがマウントされる前にルートの情報を利用して処理を行う
      async beforeRouteEnter(to, from, next) {
        const reminderId = to.query.state; // 'state' パラメータからリマインダーIDを取得
        const jwtToken = localStorage.getItem('token'); // JWTトークンをlocalStorageから取得

        if (!jwtToken) {
          ElMessage.error('認証情報が見つかりません。再度ログインしてください。');
          next('/'); // ログインページへリダイレクト
          return;
        }

        if (reminderId) {
          try {
            const headers = {
              'Authorization': `Bearer ${jwtToken}`
            };
            
            // バックエンドの /api/reminders/oauth2/callback/finalize-reminder を呼び出す
            const response = await fetch(`${REMINDER_API_URL}/oauth2/callback/finalize-reminder?reminderId=${reminderId}`, {
              method: 'GET',
              headers: headers
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Google カレンダー連携の最終処理に失敗しました。');
            }

            ElMessage.success('Google カレンダーとの連携が完了しました！');
            next('/reminders'); // リマインダー一覧ページにリダイレクト
          } catch (error) {
            console.error('Google カレンダー連携の最終処理エラー:', error);
            ElMessage.error(error.message || 'Google カレンダー連携に失敗しました。');
            next('/reminders'); // エラー時はリマインダー一覧画面に戻すなど、適切なページへ遷移
          }
        } else {
          // stateパラメータがない場合はエラーまたは通常のホームへ
          ElMessage.error('無効なGoogle認証リダイレクトです。');
          next('/');
        }
      }
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});


// 🔐 ナビゲーションガード
router.beforeEach((to, from, next) => {
 const isAuthenticated = !!localStorage.getItem('token'); // トークンの有無で判定

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/'); // 未認証ならログインページへ
  } else {
  next(); // 通過
  }
});


export default router