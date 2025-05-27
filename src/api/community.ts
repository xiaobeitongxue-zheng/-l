import request from '@/utils/request81'

// 获取社区首页知识分页内容
export function getCommunityIndexContent(startIndex: number, num: number = 10) {
  return request({
    url: '/index/content',
    method: 'post',
    params: {
      startIndex,
      num
    }
  })
}

// 查看社区首页知识详情
export function getCommunityKnowledgeDisplay(communityId: number) {
  return request({
    url: '/index/knowledge/display',
    method: 'post',
    data: {
      communityId
    }
  })
}

// 对社区知识点赞
export function likeCommunityKnowledge(communityId: number) {
  return request({
    url: '/index/like',
    method: 'post',
    data: {
      communityId
    }
  })
}

// 对社区知识取消点赞
export function unlikeCommunityKnowledge(community: number) {
  return request({
    url: '/index/unlike',
    method: 'post',
    data: {
      community
    }
  })
}

// 添加评论
export function addComment(commentAddDTO: any) {
  return request({
    url: '/index/comment',
    method: 'post',
    data: commentAddDTO
  })
}

// 获取回复评论
export function getCommentReplies(parentId: number, startIndex: number, num: number = 10) {
  return request({
    url: '/index/comment/replies',
    method: 'get',
    params: {
      parentId,
      startIndex,
      num
    }
  })
}

// 获取一级评论
export function getRootComments(knowledgeId: number, startIndex: number, num: number = 10) {
  return request({
    url: '/index/comment/root',
    method: 'get',
    params: {
      knowledgeId,
      startIndex,
      num
    }
  })
}

// 新增收藏夹
export function addFavouriteFolder(favouriteFolderDTO: any) {
  return request({
    url: '/index/favourite/addFolder',
    method: 'post',
    data: favouriteFolderDTO
  })
}

// 添加收藏项
export function addFavouriteItem(communityKnowledgeId: number, folderId: number) {
  return request({
    url: '/index/favourite/addItem',
    method: 'post',
    data: {
      communityKnowledgeId,
      folderId
    }
  })
}

// 取消收藏社区知识
export function cancelFavourite(communityKnowledgeId: number) {
  return request({
    url: `/index/favourite/concealFavourite/${communityKnowledgeId}`,
    method: 'post'
  })
}

// 删除收藏夹
export function deleteFavouriteFolder(folderId: number) {
  return request({
    url: `/index/favourite/deleteFolder/${folderId}`,
    method: 'post'
  })
}

// 修改收藏夹
export function modifyFavouriteFolder(favouriteFolderModifyDTO: any) {
  return request({
    url: '/index/favourite/modifyFolder',
    method: 'post',
    data: favouriteFolderModifyDTO
  })
}

// 展示所有收藏夹
export function getAllFavouriteFolders() {
  return request({
    url: '/index/favourite/myFolders',
    method: 'get'
  })
}

// 展示所有收藏项
export function getFavouriteItems(folderId: number) {
  return request({
    url: `/index/favourite/${folderId}/items`,
    method: 'get'
  })
}