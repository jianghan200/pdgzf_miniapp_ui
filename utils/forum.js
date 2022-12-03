const log = require('./log')
const utils = require('./util')
const app = getApp()
const constants = require('./constants')

// 通过某个小区的id生成topic
const generateCommunityTopic = function(pId) {
    return `pdgzf_project_${pId}`
}

module.exports = {
    generateCommunityTopic: generateCommunityTopic
}