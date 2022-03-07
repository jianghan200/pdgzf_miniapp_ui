const log = require('./log')
const utils = require('./util')
const app = getApp()
const constants = require('./constants')

// 获取某type, topic下所有的articles
const getArticles = function(type, topic, page, pageSize) {
    log.info(`准备获取type: ${type}, topic: ${topic}的文章`)

    const openId = app.globalData.userinfo.openId

    return wx.cloud.callFunction({
        name: 'home',
        data: {
            openid : openId,
            page: page,
            pageSize : pageSize,
            type: type,
            topic: topic
        }
    })
}

// 通过某个小区的id生成topic
const generateCommunityTopic = function(pId) {
    return `pdgzf_project_${pId}`
}

// 创建某个话题下的一个article
const postArticle = function(typeId, topic, title, contents, imageUrls, anonymous) {
    log.info('正在创建article')

    const randomUsername = constants.randomUserName()
    const unionId = app.globalData.userinfo.unionId
    const avatar = anonymous ? '' : app.globalData.avatarUrl
    const nickname = anonymous ? randomUsername : app.globalData.nickname

    return postImages(imageUrls).then(cloudUrls => {
        return wx.cloud.callFunction({
            name: 'newArticle',
            data: {
                uid: unionId,
                user_nickname: nickname,
                user_avatar: avatar,
                complex_id: 1,
                title: title,
                topic: topic,
                content: contents,
                type: typeId,
                images: cloudUrls
            }
        })
    })
}

// 根据aid query到文章详情
const getArticle = function(aid) {
    return wx.cloud.callFunction({
        name: 'getArticle',
        data: { aid: aid }
    })
}

// Helper Methods
// 根据一个本地文件url的数组，将文件上传到云函数中，并返回其在云函数中的url，供文章绑定
const postImages = function(files) {
    log.info(`准备上传图片（${files.length}张）`)

    let cloudFilePaths = [] // 需要返回的结果
    let promises = [];
    for (var i = 0; i < files.length ; i++) {
        promises.push(
            wx.cloud.uploadFile({
                cloudPath: utils.generateUuid() + '.png',
                filePath: files[i],
                name: 'picture'
            })
        );
    }

    return Promise.all(promises).then(res => {
        res.forEach((v, index) => {
            if (v == 'error') {
                log.error(`第${index + 1}个请求失败`)
                console.log('第' + (index + 1) + '个请求失败')
            } else {
                cloudFilePaths.push(v.fileID)
            }
        })

        log.info(`图片上传完成`)

        return Promise.resolve(cloudFilePaths)
    })
}

// 通过多个aid拿到多个文章
const getArticlesByIds = function(ids) {
    return wx.cloud.callFunction({
        name: 'getArticle',
        data: {
            action: 'MULTI_AID',
            ids: ids
        }
    })
}

module.exports = {
    getArticles: getArticles,
    generateCommunityTopic: generateCommunityTopic,
    postArticle: postArticle,
    getArticle: getArticle,
    getArticlesByIds: getArticlesByIds
}