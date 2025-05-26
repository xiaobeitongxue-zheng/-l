import request from '@/utils/request81.ts'

// 获取社区知识列表
export function getCommunityKnowledgeList(params: any) {
  return request({
    url: '/community/knowledge/list',
    method: 'get',
    params
  })
}

// 获取社区知识详情
export function getCommunityKnowledgeDetail(id: number) {
  return request({
    url: `/community/knowledge/detail/${id}`,
    method: 'get'
  })
}

// 点赞社区知识
export function likeCommunityKnowledge(communityId: number) {
  return request({
    url: '/index/like',
    method: 'post',
    data: {
      communityId
    }
  })
}

// 取消点赞社区知识
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

// 获取评论回复
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

// 获取根评论
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

// 获取点赞统计
export function getLikeCount(knowledgeId: number) {
  return request({
    url: '/community/like/count',
    method: 'get',
    params: {
      knowledgeId
    }
  })
}

// 搜索社区知识
export function searchCommunityKnowledge(query: string) {
  return request({
    url: '/community/knowledge/search',
    method: 'post',
    data: {
      query
    }
  })
}

// 创建社区知识
export function createCommunityKnowledge(data: any) {
  return request({
    url: '/community/knowledge/create',
    method: 'post',
    data
  })
}

// 更新社区知识
export function updateCommunityKnowledge(id: number, data: any) {
  return request({
    url: `/community/knowledge/update/${id}`,
    method: 'put',
    data
  })
}