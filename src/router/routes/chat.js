export default [
  {
    path: '/chat',
    name: 'chatHome',
    component: () => import('@/views/ChatView.vue')
  },
  {
    path: '/chat/question',
    name: 'questionHome',
    component: () => import('@/views/ChatQuestionView.vue')
  }
]
