// frontend/src/router/routes/reminder.js
export default [
    {
        path: '/reminders', // URLパス
        name: 'reminders',  // ルート名
        component: () => import('@/views/ReminderView.vue'), // ReminderView.vueを動的インポート
        meta: { requiresAuth: true } // 認証が必要なルートとしてマーク
    }
]