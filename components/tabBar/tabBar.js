const app = getApp()

Component({
  properties: {
    tab: String,
    unreadCount: {
      type: Number,
      value: 0
    }
  },
  
  data: {
    isDiscoveryPage: false
  },

  observers: {
    // 监听tab，由于在“发现”板块中，我们会使用topBar切换多个页面，而这几个Page都需要有tabBar component，且都需要显示“发现”被“选中”了
    // 如果在“发现”板块中添加新的Page，记得要在下买呢setData中append一个bool表达式
    'tab': function(tab) {
      this.setData({
        isDiscoveryPage: tab == 'news' || tab == 'newbee'
      })
    }
  },

  methods: {
    switchTab(e) {
      this.triggerEvent('switchtab', e.currentTarget.dataset.tabname)
    }
  }
})