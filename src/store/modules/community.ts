import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { 
  getCommunityKnowledgeList, 
  getCommunityKnowledgeDetail,
  likeCommunityKnowledge, 
  unlikeCommunityKnowledge,
  getLikeCount
} from '@/api/community'

export const useCommunityStore = defineStore('community', () => {
  // 社区知识列表
  const knowledgeList = ref<any[]>([])
  // 当前加载的详情
  const currentKnowledge = ref<any>(null)
  // 加载状态
  const loading = ref(false)
  // 详情加载状态
  const detailLoading = ref(false)
  // 分页信息
  const pagination = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0
  })

  // 获取社区知识列表
  const fetchKnowledgeList = async (params: any = {}) => {
    loading.value = true
    try {
      // 设置分页参数
      const requestParams = {
        page: params.page || pagination.value.currentPage,
        pageSize: params.pageSize || pagination.value.pageSize,
        ...params
      }
      
      const res = await getCommunityKnowledgeList(requestParams)
      if (res.data && res.data.code === 200) {
        knowledgeList.value = res.data.data.records || []
        pagination.value.total = res.data.data.total || 0
        return res.data.data
      }
      return null
    } catch (error) {
      console.error('获取社区知识列表失败:', error)
      return null
    } finally {
      loading.value = false
    }
  }

  // 获取社区知识详情
  const fetchKnowledgeDetail = async (id: number) => {
    detailLoading.value = true
    try {
      const res = await getCommunityKnowledgeDetail(id)
      if (res.data && res.data.code === 200) {
        currentKnowledge.value = res.data.data
        return res.data.data
      }
      return null
    } catch (error) {
      console.error('获取社区知识详情失败:', error)
      return null
    } finally {
      detailLoading.value = false
    }
  }

  // 点赞社区知识
  const likeKnowledge = async (id: number) => {
    try {
      const res = await likeCommunityKnowledge(id)
      if (res.data && res.data.code === 200) {
        // 如果当前详情页是这条知识，更新点赞状态
        if (currentKnowledge.value && currentKnowledge.value.id === id) {
          currentKnowledge.value.liked = true
          currentKnowledge.value.likeCount = (currentKnowledge.value.likeCount || 0) + 1
        }
        
        // 更新列表中的点赞状态
        const item = knowledgeList.value.find(item => item.id === id)
        if (item) {
          item.liked = true
          item.likeCount = (item.likeCount || 0) + 1
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('点赞失败:', error)
      return false
    }
  }

  // 取消点赞
  const unlikeKnowledge = async (id: number) => {
    try {
      const res = await unlikeCommunityKnowledge(id)
      if (res.data && res.data.code === 200) {
        // 如果当前详情页是这条知识，更新点赞状态
        if (currentKnowledge.value && currentKnowledge.value.id === id) {
          currentKnowledge.value.liked = false
          currentKnowledge.value.likeCount = Math.max((currentKnowledge.value.likeCount || 1) - 1, 0)
        }
        
        // 更新列表中的点赞状态
        const item = knowledgeList.value.find(item => item.id === id)
        if (item) {
          item.liked = false
          item.likeCount = Math.max((item.likeCount || 1) - 1, 0)
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('取消点赞失败:', error)
      return false
    }
  }

  // 获取点赞数量
  const fetchLikeCount = async (id: number) => {
    try {
      const res = await getLikeCount(id)
      if (res.data && res.data.code === 200) {
        // 更新相应知识的点赞数
        if (currentKnowledge.value && currentKnowledge.value.id === id) {
          currentKnowledge.value.likeCount = res.data.data
        }
        
        const item = knowledgeList.value.find(item => item.id === id)
        if (item) {
          item.likeCount = res.data.data
        }
        
        return res.data.data
      }
      return 0
    } catch (error) {
      console.error('获取点赞数量失败:', error)
      return 0
    }
  }

  // 重置社区状态
  const resetCommunity = () => {
    knowledgeList.value = []
    currentKnowledge.value = null
    pagination.value = {
      currentPage: 1,
      pageSize: 10,
      total: 0
    }
  }

  return {
    knowledgeList,
    currentKnowledge,
    loading,
    detailLoading,
    pagination,
    fetchKnowledgeList,
    fetchKnowledgeDetail,
    likeKnowledge,
    unlikeKnowledge,
    fetchLikeCount,
    resetCommunity
  }
}) 