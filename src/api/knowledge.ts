import request from '@/utils/request81'

// 知识集相关API

// 创建知识集
export function createKnowledgeSet(data: any) {
  return request({
    url: '/user/kbs',
    method: 'post',
    data
  })
}

// 更新知识集
export function updateKnowledgeSet(data: any) {
  return request({
    url: '/user/kbs',
    method: 'put',
    data
  })
}

// 获取知识集列表
export function getKnowledgeSets(spaceId: number) {
  return request({
    url: '/user/kbs',
    method: 'get',
    params: {
      space: spaceId
    }
  })
}

// 删除知识集
export function deleteKnowledgeSet(id: number, spaceId?: number) {
  return request({
    url: '/user/kbs',
    method: 'delete',
    params: {
      id,
      space: spaceId
    }
  })
}

// 知识相关API

// 搜索知识
export function searchKnowledge(keyword: string, space: number) {
  return request({
    url: '/api/knowledge/search',
    method: 'get',
    params: {
      keyword,
      space
    }
  })
}

// 新增知识
export function createKnowledge(setId: number, spaceId: number, data: FormData) {
  return request({
    url: `/user/ks/${setId}/${spaceId}`,
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取知识预览
export function getKnowledgePreview(setId: number, spaceId: number, knowledgeId: number) {
  return request({
    url: `/user/ks/preview/${setId}/${spaceId}/${knowledgeId}`,
    method: 'get'
  })
}

// 修改知识预览
export function updateKnowledgePreview(setId: number, spaceId: number, knowledgeId: number, data: any) {
  return request({
    url: `/user/ks/preview/${setId}/${spaceId}/${knowledgeId}`,
    method: 'put',
    data
  })
}

// 获取所有知识
export function getAllKnowledge(spaceId: number,setId: number) {
  return request({
    url: `/user/ks/${spaceId}/${setId}`,
    method: 'get'
  })
}

// 获取指定知识
export function getKnowledge(spaceId: number,setId: number,knowledgeId: number) {
  return request({
    url: `/user/ks/preview/${spaceId}/${setId}/${knowledgeId}`,
    method: 'get'
  })
}

// 修改知识
export function updateKnowledge(setId: number, spaceId: number, knowledgeId: number, data: FormData) {
  return request({
    url: `/user/ks/${setId}/${spaceId}/${knowledgeId}`,
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 删除知识
export function deleteKnowledge(setId: number, spaceId: number, knowledgeId: number) {
  return request({
    url: `/user/ks/${setId}/${spaceId}/${knowledgeId}`,
    method: 'delete'
  })
}

//  发布知识到社区
export function publishKnowledge(spaceId: number, setId: number,  knowledgeId: number) {
  return request({
    url: `/user/ks/public/${spaceId}/${setId}/${knowledgeId}`,
    method: 'post'
  })
}

//  取消发布知识到社区
export function cancelPublishKnowledge(spaceId: number, setId: number,  knowledgeId: number) {
  return request({
    url: `/user/ks/private/${spaceId}/${setId}/${knowledgeId}`,
    method: 'post'
  })
}
