import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import chatRoutes from './routes/chat'
import reflectionRoutes from './routes/reflection'
import Login from '../views/LoginView.vue'
import roadmapRoutes from './routes/roadmap'
import taskManage from './routes/taskManage'



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
  {
    path: '/taskManage',
    name: 'taskManage',
    component: () => import('../views/TaskManageView.vue')
  },
  ...chatRoutes,
  ...reflectionRoutes,
  ...roadmapRoutes,
  ...taskManage
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