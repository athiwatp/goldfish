import Vue from 'vue'
import axios from 'axios'
import NProgress from 'vue-nprogress'
import { sync } from 'vuex-router-sync'
import App from './App.vue'
import router from './router'
import store from './store'
import * as filters from './filters'
import { TOGGLE_SIDEBAR } from 'vuex-store/mutation-types'
import Notification from 'vue-bulma-notification'
import Message from 'vue-bulma-message'

Vue.prototype.$http = axios
Vue.axios = axios
Vue.use(NProgress)

// Enable devtools
Vue.config.devtools = true

sync(store, router)

const nprogress = new NProgress({ parent: '.nprogress-container' })

const { state } = store

router.beforeEach((route, redirect, next) => {
  if (state.app.device.isMobile && state.app.sidebar.opened) {
    store.commit(TOGGLE_SIDEBAR, false)
  }
  next()
})

Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
})

const app = new Vue({
  router,
  store,
  nprogress,
  ...App
})

const NotificationComponent = Vue.extend(Notification)
const openNotification = (propsData = {
  title: '',
  message: '',
  type: '',
  direction: '',
  duration: 4500,
  container: '.notifications'
}) => {
  return new NotificationComponent({
    el: document.createElement('div'),
    propsData
  })
}
Vue.prototype.$notify = openNotification

function handleError (error) {
  // if the server gave a response message, print that
  if (error.response.data.error) {
    openNotification({
      title: 'Error: ' + error.response.status,
      message: error.response.data.error,
      type: 'danger'
    })
    console.log(error.response.data.error)
  } else {
    // 403s happen mostly because of invalid CSRF tokens
    if (error.response.status === 403) {
      openNotification({
        title: 'Error: 403',
        message: 'Invalid CSRF. Try refreshing the page',
        type: 'danger'
      })
    } else {
    // otherwise, it's likely the user isn't logged in
      openNotification({
        title: 'Error: ' + error.response.status.toString(),
        message: 'Please login first',
        type: 'danger'
      })
    }
    console.log(error.message)
  }
}
Vue.prototype.$onError = handleError

const MessageComponent = Vue.extend(Message)
const openMessage = (propsData = {
  title: '',
  message: '',
  type: '',
  direction: '',
  duration: 1500,
  container: '.messages'
}) => {
  return new MessageComponent({
    el: document.createElement('div'),
    propsData
  })
}
Vue.prototype.$message = openMessage

export { app, router, store }
