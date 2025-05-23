import { createApp } from 'vue'
import '@mdi/font/css/materialdesignicons.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import installElementPlus from './plugins/element'
import router from './router'
import store from './store'

const app = createApp(App).use(store).use(router)
installElementPlus(app)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.mount('#app')