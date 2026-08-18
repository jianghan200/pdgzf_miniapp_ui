const comment = require('../../utils/comment')

Component({
  properties: {
    targetType: { type: String, value: '' },
    targetId: { type: Number, value: 0 },
    hideTrigger: { type: Boolean, value: false }  // 父页面已有底部栏时设 true，自行提供触发
  },

  data: {
    comments: [],
    total: 0,
    page: 1,
    size: 20,
    hasMore: false,
    loading: false,

    // 输入面板
    inputVisible: false,
    inputText: '',
    inputImages: [],
    uploadingCount: 0,
    replyingTo: null,  // null=发一级; {parentId, replyToUserId, replyToCommentId, replyToName}
    isPrivate: false,  // 仅房东可见（仅一级评论可用）
    submitting: false
  },

  observers: {
    'targetType, targetId': function (type, id) {
      if (type && id) {
        this.setData({ page: 1, comments: [], total: 0 })
        this.loadComments()
      }
    }
  },

  lifetimes: {
    attached() {
      if (this.data.targetType && this.data.targetId) {
        this.loadComments()
      }
    }
  },

  methods: {
    // ---------- 一级评论 ----------
    loadComments() {
      if (this.data.loading) return
      this.setData({ loading: true })
      comment.listComments(this.data.targetType, this.data.targetId, this.data.page, this.data.size)
        .then(res => {
          if (res && res.status === 0) {
            const d = res.data
            const newComments = (d.list || []).map(c => ({
              ...c,
              replies: [],
              repliesLoaded: false,
              repliesExpanded: false
            }))
            const comments = this.data.page === 1 ? newComments : [...this.data.comments, ...newComments]
            this.setData({
              comments,
              total: d.total,
              hasMore: comments.length < d.total
            })
          }
          this.setData({ loading: false })
        })
    },

    loadMore() {
      if (!this.data.hasMore || this.data.loading) return
      this.setData({ page: this.data.page + 1 })
      this.loadComments()
    },

    // ---------- 二级回复 ----------
    toggleReplies(e) {
      const id = e.currentTarget.dataset.id
      const idx = this.data.comments.findIndex(x => x.id === id)
      if (idx < 0) return
      const c = this.data.comments[idx]
      if (c.repliesExpanded) {
        this.setData({ [`comments[${idx}].repliesExpanded`]: false })
      } else if (!c.repliesLoaded) {
        this.loadReplies(id)
      } else {
        this.setData({ [`comments[${idx}].repliesExpanded`]: true })
      }
    },

    loadReplies(parentId) {
      comment.listReplies(parentId, 1, 100).then(res => {
        if (res && res.status === 0) {
          const idx = this.data.comments.findIndex(x => x.id === parentId)
          if (idx >= 0) {
            this.setData({
              [`comments[${idx}].replies`]: res.data.list || [],
              [`comments[${idx}].repliesLoaded`]: true,
              [`comments[${idx}].repliesExpanded`]: true
            })
          }
        }
      })
    },

    // ---------- 输入面板 ----------
    openInput(e) {
      // 兼容父页面 selectComponent('#xx').openInput() 无参调用
      const ds = (e && e.currentTarget && e.currentTarget.dataset) || {}
      if (ds.parentId) {
        this.setData({
          inputVisible: true,
          inputText: '',
          inputImages: [],
          replyingTo: {
            parentId: ds.parentId,
            replyToUserId: ds.replyToUserId,
            replyToCommentId: ds.replyToCommentId,
            replyToName: ds.replyToName
          },
          // 二级回复不支持勾选"仅房东可见"（继承一级评论的隐私属性）
          isPrivate: false
        })
      } else {
        this.setData({
          inputVisible: true,
          inputText: '',
          inputImages: [],
          replyingTo: null,
          isPrivate: false
        })
      }
      this.triggerEvent('inputstatechange', { visible: true })
    },

    closeInput() {
      this.setData({ inputVisible: false, inputText: '', inputImages: [], replyingTo: null, isPrivate: false })
      this.triggerEvent('inputstatechange', { visible: false })
    },

    onInputText(e) {
      this.setData({ inputText: e.detail.value })
    },

    // ---------- 图片 ----------
    chooseImage() {
      const remain = 9 - this.data.inputImages.length
      if (remain <= 0) return
      wx.chooseMedia({
        count: remain,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const files = res.tempFiles.map(f => f.tempFilePath)
          this.uploadImages(files)
        }
      })
    },

    uploadImages(files) {
      this.setData({ uploadingCount: this.data.uploadingCount + files.length })
      files.forEach(f => {
        comment.uploadImage(f).then(res => {
          if (res && res.url) {
            this.setData({ inputImages: [...this.data.inputImages, res.url] })
          }
          this.setData({ uploadingCount: this.data.uploadingCount - 1 })
        })
      })
    },

    removeImage(e) {
      const idx = e.currentTarget.dataset.idx
      const images = [...this.data.inputImages]
      images.splice(idx, 1)
      this.setData({ inputImages: images })
    },

    previewImage(e) {
      const ds = e.currentTarget.dataset
      wx.previewImage({ urls: ds.urls, current: ds.current })
    },

    togglePrivate() {
      this.setData({ isPrivate: !this.data.isPrivate })
    },

    // ---------- 提交 ----------
    submit() {
      const text = (this.data.inputText || '').trim()
      if (!text && this.data.inputImages.length === 0) {
        wx.showToast({ title: '请输入内容', icon: 'none' })
        return
      }
      if (this.data.uploadingCount > 0) {
        wx.showToast({ title: '图片上传中', icon: 'none' })
        return
      }
      if (this.data.submitting) return
      this.setData({ submitting: true })

      const payload = {
        target_type: this.data.targetType,
        target_id: this.data.targetId,
        content: text,
        images: this.data.inputImages
      }
      if (this.data.replyingTo) {
        const r = this.data.replyingTo
        payload.parent_id = r.parentId
        payload.reply_to_user_id = r.replyToUserId
        payload.reply_to_comment_id = r.replyToCommentId
      } else if (this.data.isPrivate) {
        // 仅一级评论支持"仅房东可见"
        payload.is_private = 1
      }

      comment.createComment(payload).then(res => {
        this.setData({ submitting: false })
        if (res && res.status === 0) {
          const pending = res.data && res.data.pending_review
          if (pending) {
            wx.showToast({ title: '已提交，待审核', icon: 'none', duration: 2000 })
          } else {
            wx.showToast({ title: '已发送', icon: 'success' })
          }
          // 刷新列表（自己发的待审核评论也能在列表里看到，带"审核中"标签）
          if (this.data.replyingTo) {
            const pid = this.data.replyingTo.parentId
            this.loadReplies(pid)
            // 待审核的二级评论不计入 reply_count，审核通过后才补增
            if (!pending) {
              const idx = this.data.comments.findIndex(x => x.id === pid)
              if (idx >= 0) {
                this.setData({ [`comments[${idx}].reply_count`]: this.data.comments[idx].reply_count + 1 })
              }
            }
          } else {
            this.setData({ page: 1 })
            this.loadComments()
          }
          this.closeInput()
        } else {
          wx.showToast({ title: (res && res.msg) || '发送失败', icon: 'none' })
        }
      })
    },

    // ---------- 点赞 ----------
    onLike(e) {
      const id = e.currentTarget.dataset.id
      comment.toggleLike(id).then(res => {
        if (res && res.status === 0) {
          // 一级评论
          const idx = this.data.comments.findIndex(x => x.id === id)
          if (idx >= 0) {
            this.setData({
              [`comments[${idx}].liked_by_me`]: res.data.liked,
              [`comments[${idx}].like_count`]: res.data.like_count
            })
            return
          }
          // 二级回复
          for (let i = 0; i < this.data.comments.length; i++) {
            const c = this.data.comments[i]
            const ridx = c.replies ? c.replies.findIndex(r => r.id === id) : -1
            if (ridx >= 0) {
              this.setData({
                [`comments[${i}].replies[${ridx}].liked_by_me`]: res.data.liked,
                [`comments[${i}].replies[${ridx}].like_count`]: res.data.like_count
              })
              return
            }
          }
        } else if (res && res.msg === '未登录') {
          wx.showToast({ title: '请先登录', icon: 'none' })
        }
      })
    },

    // ---------- 删除 ----------
    onDelete(e) {
      const id = e.currentTarget.dataset.id
      wx.showModal({
        title: '删除评论',
        content: '确定删除这条评论吗？',
        success: (r) => {
          if (!r.confirm) return
          comment.deleteComment(id).then(res => {
            if (res && res.status === 0) {
              wx.showToast({ title: '已删除', icon: 'success' })
              const idx = this.data.comments.findIndex(x => x.id === id)
              if (idx >= 0) {
                const comments = [...this.data.comments]
                comments.splice(idx, 1)
                this.setData({ comments, total: this.data.total - 1 })
                return
              }
              for (let i = 0; i < this.data.comments.length; i++) {
                const c = this.data.comments[i]
                const ridx = c.replies ? c.replies.findIndex(r => r.id === id) : -1
                if (ridx >= 0) {
                  const replies = [...c.replies]
                  replies.splice(ridx, 1)
                  this.setData({
                    [`comments[${i}].replies`]: replies,
                    [`comments[${i}].reply_count`]: Math.max(0, c.reply_count - 1)
                  })
                  return
                }
              }
            } else {
              wx.showToast({ title: (res && res.msg) || '删除失败', icon: 'none' })
            }
          })
        }
      })
    }
  }
})
