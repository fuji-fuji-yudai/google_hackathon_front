export default [
  {
    path: '/reflection/home',
    name: 'reflectionHome',
    component: () => import('@/views/reflection/HomeView.vue')
  },
  {
    path: '/reflection/register',
    name: 'reflectionRegister',
    component: () => import('@/views/reflection/ReflectionRegisterView.vue')
  }
]