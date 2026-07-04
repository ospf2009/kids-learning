import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/global.css'

try {
  const app = createApp(App)
  
  app.config.errorHandler = (err, instance, info) => {
    const msg = err instanceof Error ? err.message : String(err)
    window.__kidsErrors = window.__kidsErrors || []
    window.__kidsErrors.push({ msg: '[Vue] ' + msg + ' (' + info + ')' })
  }
  
  app.use(createPinia())
  app.use(router)
  
  app.mount('#app')
} catch (e) {
  window.__kidsErrors = window.__kidsErrors || []
  window.__kidsErrors.push({ msg: '[Init Error] ' + (e instanceof Error ? e.message : String(e)) })
}
