var app = getApp();
var utils = require('../../utils/util.js');

// account: null
// autoChoose: 1
// email: "18825169013@163.com"
// emailExpireDate: null
// emailSubscription: 1
// id: 11
// loginDate: "2021-12-30 21:40:50"
// manualStartDate: "2020-10-12"
// name: "星空冰淇淋"
// openConsult: false
// openId: "o4Sva5AWDNq6ZAqUEAP8lQkTz72M"
// password: null
// realName: null
// serverAccountId: null
// startDate: null
// tokenStr: "34dc9091-756b-42a2-910f-fb5061ea0514"
// type: 0
// unionId: "oTmbiwqdRX59s99WzvROiqYljNho"

Page({
  data: {
    app: app.globalData,
    type: app.TYPE_POST,
    title: null,
    content: null,
    maxfile: 3,
    files: [],
    cloudFilesPath:[],
    isPosting: false,
  },

  btnPost: function () {
    if(this.data.isPosting){
      return;
    }

    var that = this;
    that.setData({
      isPosting: true
    });
    
    if (that.data.content == '' || that.data.title == '') {
      wx.showModal({
        title: '',
        content: '带点干货，更多点赞哦',
      });
      return;
    } else if (that.data.files.length<=0) {
      wx.showModal({
        title: '',
        content: '请至少上传一张照片',
      });
      return;
    }

    wx.showModal({
      title: '',
      content: '确定发布 '+that.data.title+' 吗？',
      success: function (res) {
        if (that.data.files.length > 0) {
          that.startUploadImage(that.data.files, function () {
            that.backAndShowSuccessTips();
          });
        } else {
          that.postNewArticle();
          that.backAndShowSuccessTips();
        }
      }
    })
  },
  backAndShowSuccessTips: function () {
    wx.showModal({
      title:"",
      content: "发布成功",
      showCancel:false,
      success:function(res){
        // app.getPrevPage().refresh();
        wx.navigateBack({});
      }
    });
  },

  
  startUploadImage: function ( files, cb) {
    var that = this;
    var currentUploadIndex = 1;
    wx.showToast({
      title: '正在上传图片...' ,
      icon: 'loading',
      mask: true,
      duration: 9999999
    });
   
    if(that.data.files.length > 0){
      var promises = [];
      for (var i = 0; i < that.data.files.length ; i++) {
        promises.push(
          wx.cloud.uploadFile({
            cloudPath: utils.generateUuid()+'.png',
            filePath: that.data.files[i],
            name: 'picture'
          })
        );
      }
      Promise.all(promises).then(values => {
        values.map((v,index) => {
          if(v == 'error'){
            console.log('第' + (index+1) + '个请求失败')
          }else{
            console.log(v)
            that.data.cloudFilesPath.push(v.fileID);
            that.setData({
              cloudFilesPath: that.data.cloudFilesPath
            });
          }
        })
        wx.hideToast();
        console.log(that.data.cloudFilesPath);
        this.postNewArticle()
      }).catch(error => {
        console.log(error)
      })

    }
    
  },

  postNewArticle(){
    var that = this;
    var postData = {
      uid: that.data.userinfo.unionId,
      userNickName: that.data.userinfo.name,
      userAvatarUrl: null,
      complex_id: 1,
      title: that.data.title,
      content: that.data.content,
      // sub_cat: "车位租赁",
      type: 1,
      images: that.data.cloudFilesPath
    }
    console.log(postData)
    wx.cloud.callFunction({
        name: 'newArticle',
        data: postData
    }).then(res => {
      console.log("发布成功");
      that.setData({
        isPosting: false
      });
      wx.showToast({
        title: '发布成功',
      })
      that.backAndRefresh()
    })
  },

  backAndRefresh(){
      let pages = getCurrentPages();
      let prevPage = pages[pages.length - 2];//上一个页面
      //直接调用上一个页面的setData()方法，把数据存到上一个页面中去
      prevPage.setData({
        refreshData: true
      })
      // 发布了新文章，全局要刷新
      app.globalData.refreshData = true;
      // let home = pages[pages.length - 2];//上一个页面
      wx.navigateBack({
        delta: 1
      })          
  },
 
  // 让用户选择一张图片
  chooseImage: function (e) {
    var that = this;
    wx.chooseImage({
      sizeType: ['original','compressed'], //'original', 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var files = that.data.files;
        var curLenth = files.length;
        console.log("本次选择:" + res.tempFilePaths.length);
        console.log("可选总数，当前总数:", that.data.maxfile, curLenth);
        for (var i = 0; i < that.data.maxfile - curLenth; i++) {
          if (res.tempFilePaths[i]) {
            console.log("Add to files", i, res.tempFilePaths[i]);
            files.push(res.tempFilePaths[i]);
          }
        }
        that.setData({
          files: files
        });
      }
    })
  },
  // 用户预览图片
  previewImage: function (e) {
    var that = this;
    var index = e.currentTarget.id.substr(4, e.currentTarget.id.length);
    wx.showActionSheet({
      itemList: ["预览", "删除此照片"],
      success: function (res) {
        if (res.tapIndex == 0) {
          wx.previewImage({
            current: that.data.files[index], // 当前显示图片的http链接
            urls: that.data.files // 需要预览的图片http链接列表
          })
        } else if (res.tapIndex == 1) {
          var files = that.data.files;
          files.splice(index, 1);
          that.setData({
            files: files
          });
        }
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let userinfo = app.globalData.userinfo;
    this.setData({
      userinfo: userinfo
    });
    console.log(userinfo)
    //用户必须授权过昵称和头像
    // if(app.globalData.user.avatarUrl == null){
    //   nav.requireUserInfo();
    // }
  },

})