import lazyLoading from './lazyLoading'

export default {
  meta: {
    label: 'Tools',
    icon: 'fa-wrench',
    expanded: true
  },
  children: [
    {
      name: 'Transit',
      path: '/transit',
      component: lazyLoading('tools/Transit')
    }
  ]
}
