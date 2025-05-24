import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import chatRoutes from './routes/chat'
import reflectionRoutes from './routes/reflection'
import Login from '../views/LoginView.vue';



const routes = [
  {
    path: '/home',
    name: 'home',
    component: HomeView
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
  ...reflectionRoutes
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
