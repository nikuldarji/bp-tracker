import { createApp } from 'vue'
import App from './App.vue'

// Vuetify core
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

// Components & Directives (THIS IS MISSING IN YOUR CODE)
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Icons
import '@mdi/font/css/materialdesignicons.css'

// Create Vuetify instance
const vuetify = createVuetify({
    components,
    directives,
})

createApp(App)
    .use(vuetify)
    .mount('#app')