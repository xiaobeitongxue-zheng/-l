<template>
  <div class="knowledge-detail-container">
    <div class="page-header">
      <h2>社区知识详情</h2>
      <el-button @click="goBack">
        <el-icon><Back /></el-icon> 返回
      </el-button>
    </div>

    <el-card v-loading="loading" class="detail-card">
      <template v-if="knowledge">
        <div class="knowledge-header">
          <h1 class="knowledge-title">{{ knowledge.title }}</h1>
          <div class="knowledge-meta">
            <span class="author">作者：{{ knowledge.author?.name || '未知' }}</span>
            <span class="time">发布时间：{{ formatTime(knowledge.createTime) }}</span>
            <span class="category">分类：{{ knowledge.category }}</span>
          </div>
          <div class="knowledge-tags">
            <el-tag
              v-for="tag in knowledge.tags"
              :key="tag"
              size="small"
              effect="plain"
              class="tag-item"
            >{{ tag }}</el-tag>
          </div>
        </div>
        
        <div class="knowledge-content">
          <div class="content-body" v-html="knowledge.content"></div>
        </div>
        
        <div class="knowledge-actions">
          <div 
            class="action-item" 
            :class="{ 'is-active': knowledge.liked }"
            @click="toggleLike"
          >
            <span class="thumb-icon" :class="{ 'liked': knowledge.liked }">
              <i class="thumb-up"></i>
            </span>
            <span>点赞 ({{ knowledge.likeCount || 0 }})</span>
          </div>
          <div 
            class="action-item" 
            :class="{ 'is-active': knowledge.collected }"
            @click="toggleCollect"
          >
            <el-icon>
              <component :is="knowledge.collected ? 'StarFilled' : 'Star'" />
            </el-icon>
            <span>收藏 ({{ knowledge.collectCount || 0 }})</span>
          </div>
          <div class="action-item">
            <el-icon><Share /></el-icon>
            <span>分享</span>
          </div>
        </div>
      </template>
      
      <el-empty v-else description="内容不存在或已被删除"></el-empty>
    </el-card>

    <!-- 评论区 -->
    <el-card class="comments-card">
      <template #header>
        <div class="card-header">
          <el-icon><ChatDotRound /></el-icon>
          <span>评论区 ({{ totalComments }})</span>
        </div>
      </template>

      <!-- 评论输入框 -->
      <div class="comment-form">
        <el-input
          v-model="commentContent"
          type="textarea"
          :rows="3"
          placeholder="写下你的评论..."
          :maxlength="1000"
          show-word-limit
        ></el-input>
        <div class="form-actions">
          <el-button 
            type="primary" 
            @click="submitComment" 
            :loading="submittingComment"
            :disabled="!commentContent.trim()"
          >发表评论</el-button>
        </div>
      </div>

      <!-- 评论列表 -->
      <div v-loading="loadingComments" class="comments-list">
        <div v-if="comments.length === 0" class="empty-comments">
          <el-empty description="暂无评论，快来发表第一条评论吧！"></el-empty>
        </div>
        
        <div v-else class="comment-items">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-avatar">
              <el-avatar :size="40" :src="comment.authorAvatar || ''"></el-avatar>
            </div>
            <div class="comment-body">
              <div class="comment-header">
                <span class="comment-author">{{ comment.authorName }}</span>
                <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
              <div class="comment-actions">
                <el-button type="text" size="small" @click="replyToComment(comment)">回复</el-button>
              </div>
              
              <!-- 回复列表 -->
              <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
                <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                  <div class="reply-avatar">
                    <el-avatar :size="32" :src="reply.authorAvatar || ''"></el-avatar>
                  </div>
                  <div class="reply-body">
                    <div class="reply-header">
                      <span class="reply-author">{{ reply.authorName }}</span>
                      <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
                    </div>
                    <div class="reply-content">
                      <template v-if="reply.replyTo">回复 <span class="reply-to">@{{ reply.replyTo }}</span>：</template>
                      {{ reply.content }}
                    </div>
                    <div class="reply-actions">
                      <el-button type="text" size="small" @click="replyToSubComment(comment, reply)">回复</el-button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 查看更多回复 -->
              <div v-if="comment.hasMoreReplies" class="more-replies">
                <el-button type="text" @click="loadMoreReplies(comment)">
                  查看更多回复
                </el-button>
              </div>
              
              <!-- 回复输入框 -->
              <div v-if="replyingTo && replyingTo.id === comment.id" class="reply-form">
                <el-input
                  v-model="replyContent"
                  type="textarea"
                  :rows="2"
                  :placeholder="replyingToSub ? `回复 @${replyingToSub.authorName}` : '写下你的回复...'"
                  :maxlength="500"
                  show-word-limit
                ></el-input>
                <div class="form-actions">
                  <el-button @click="cancelReply">取消</el-button>
                  <el-button 
                    type="primary" 
                    @click="submitReply(comment)" 
                    :loading="submittingReply"
                    :disabled="!replyContent.trim()"
                  >回复</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 评论分页 -->
        <div v-if="comments.length > 0" class="comments-pagination">
          <el-button 
            v-if="hasMoreComments" 
            type="primary" 
            plain 
            @click="loadMoreComments"
            :loading="loadingMoreComments"
          >加载更多评论</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back, Star, StarFilled, ChatDotRound, Share } from '@element-plus/icons-vue'
import { useCommunityStore } from '@/store/modules/community'
import { useFavoritesStore } from '@/store/modules/favorites'
import { 
  getCommunityKnowledgeDetail, 
  getRootComments, 
  getCommentReplies, 
  addComment,
  likeCommunityKnowledge,
  unlikeCommunityKnowledge
} from '@/api/community'

const route = useRoute()
const router = useRouter()
const communityStore = useCommunityStore()
const favoritesStore = useFavoritesStore()

// 获取知识ID
const knowledgeId = computed(() => Number(route.params.id) || 0)

// 知识详情
const knowledge = ref<any>(null)
const loading = ref(false)

// 评论相关
const comments = ref<any[]>([])
const commentContent = ref('')
const replyContent = ref('')
const loadingComments = ref(false)
const submittingComment = ref(false)
const submittingReply = ref(false)
const loadingMoreComments = ref(false)
const commentStartIndex = ref(0)
const commentPageSize = ref(10)
const hasMoreComments = ref(false)
const totalComments = ref(0)

// 回复状态
const replyingTo = ref<any>(null)
const replyingToSub = ref<any>(null)

// 返回上一页
const goBack = () => {
  router.back()
}

// 加载知识详情
const loadKnowledgeDetail = async () => {
  if (!knowledgeId.value) {
    ElMessage.error('无效的知识ID')
    return
  }
  
  loading.value = true
  try {
    // 使用store加载详情
    const detail = await communityStore.fetchKnowledgeDetail(knowledgeId.value)
    if (detail) {
      knowledge.value = detail
    } else {
      ElMessage.error('获取知识详情失败')
    }
  } catch (error) {
    console.error('获取社区知识详情失败:', error)
    ElMessage.error('获取知识详情失败，请重试')
  } finally {
    loading.value = false
  }
}

// 加载评论列表
const loadComments = async (refresh = false) => {
  if (!knowledgeId.value) return
  
  loadingComments.value = true
  try {
    if (refresh) {
      commentStartIndex.value = 0
      comments.value = []
    }
    
    const res = await getRootComments(knowledgeId.value, commentStartIndex.value, commentPageSize.value)
    if (res.data && res.data.code === 200) {
      const newComments = res.data.data.records || []
      totalComments.value = res.data.data.total || 0
      
      // 处理每条评论，初始化回复列表
      for (const comment of newComments) {
        comment.replies = []
        comment.hasMoreReplies = comment.replyCount > 0
        // 如果有回复，则加载第一页回复
        if (comment.replyCount > 0) {
          await loadCommentReplies(comment)
        }
      }
      
      if (refresh) {
        comments.value = newComments
      } else {
        comments.value = [...comments.value, ...newComments]
      }
      
      // 判断是否还有更多评论
      hasMoreComments.value = comments.value.length < totalComments.value
      
      // 更新下一页的起始索引
      if (newComments.length > 0) {
        commentStartIndex.value += newComments.length
      }
    } else {
      ElMessage.error('获取评论失败')
    }
  } catch (error) {
    console.error('加载评论失败:', error)
    ElMessage.error('加载评论失败，请重试')
  } finally {
    loadingComments.value = false
  }
}

// 加载更多评论
const loadMoreComments = async () => {
  if (loadingMoreComments.value) return
  
  loadingMoreComments.value = true
  try {
    await loadComments()
  } finally {
    loadingMoreComments.value = false
  }
}

// 加载评论的回复
const loadCommentReplies = async (comment: any, refresh = false) => {
  if (!comment) return
  
  try {
    // 如果刷新，则清空已有回复
    if (refresh) {
      comment.replies = []
      comment.replyStartIndex = 0
    }
    
    // 设置起始索引
    const startIndex = comment.replyStartIndex || 0
    const pageSize = 5 // 每次加载5条回复
    
    const res = await getCommentReplies(comment.id, startIndex, pageSize)
    if (res.data && res.data.code === 200) {
      const newReplies = res.data.data.records || []
      
      // 添加回复到列表
      if (refresh) {
        comment.replies = newReplies
      } else {
        comment.replies = [...comment.replies, ...newReplies]
      }
      
      // 更新回复的起始索引
      comment.replyStartIndex = (comment.replyStartIndex || 0) + newReplies.length
      
      // 判断是否还有更多回复
      comment.hasMoreReplies = comment.replies.length < (comment.replyCount || 0)
      
      return newReplies
    }
    return []
  } catch (error) {
    console.error('加载回复失败:', error)
    return []
  }
}

// 加载更多回复
const loadMoreReplies = async (comment: any) => {
  if (!comment) return
  
  try {
    await loadCommentReplies(comment)
  } catch (error) {
    console.error('加载更多回复失败:', error)
    ElMessage.error('加载回复失败，请重试')
  }
}

// 提交评论
const submitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('评论内容不能为空')
    return
  }
  
  if (!knowledgeId.value) {
    ElMessage.error('无效的知识ID')
    return
  }
  
  submittingComment.value = true
  try {
    const commentData = {
      communityKnowledgeId: knowledgeId.value,
      content: commentContent.value.trim(),
      parentId: 0 // 顶级评论
    }
    
    const res = await addComment(commentData)
    if (res.data && res.data.code === 200) {
      ElMessage.success('评论发表成功')
      commentContent.value = '' // 清空输入框
      
      // 刷新评论列表
      await loadComments(true)
      
      // 更新知识的评论数
      if (knowledge.value) {
        knowledge.value.commentCount = (knowledge.value.commentCount || 0) + 1
      }
    } else {
      ElMessage.error('评论发表失败')
    }
  } catch (error) {
    console.error('提交评论失败:', error)
    ElMessage.error('评论发表失败，请重试')
  } finally {
    submittingComment.value = false
  }
}

// 回复评论
const replyToComment = (comment: any) => {
  replyingTo.value = comment
  replyingToSub.value = null
  replyContent.value = ''
}

// 回复子评论
const replyToSubComment = (comment: any, reply: any) => {
  replyingTo.value = comment
  replyingToSub.value = reply
  replyContent.value = ''
}

// 取消回复
const cancelReply = () => {
  replyingTo.value = null
  replyingToSub.value = null
  replyContent.value = ''
}

// 提交回复
const submitReply = async (comment: any) => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('回复内容不能为空')
    return
  }
  
  if (!knowledgeId.value || !comment) {
    ElMessage.error('参数错误')
    return
  }
  
  submittingReply.value = true
  try {
    const replyData = {
      communityKnowledgeId: knowledgeId.value,
      content: replyContent.value.trim(),
      parentId: comment.id, // 父评论ID
      targetCommentId: replyingToSub.value ? replyingToSub.value.id : null // 目标回复ID
    }
    
    const res = await addComment(replyData)
    if (res.data && res.data.code === 200) {
      ElMessage.success('回复发表成功')
      replyContent.value = '' // 清空输入框
      
      // 取消回复状态
      cancelReply()
      
      // 刷新当前评论的回复列表
      await loadCommentReplies(comment, true)
      
      // 更新评论的回复数
      comment.replyCount = (comment.replyCount || 0) + 1
      
      // 更新知识的评论数
      if (knowledge.value) {
        knowledge.value.commentCount = (knowledge.value.commentCount || 0) + 1
      }
    } else {
      ElMessage.error('回复发表失败')
    }
  } catch (error) {
    console.error('提交回复失败:', error)
    ElMessage.error('回复发表失败，请重试')
  } finally {
    submittingReply.value = false
  }
}

// 点赞知识
const toggleLike = async () => {
  if (!knowledge.value || !knowledgeId.value) return
  
  try {
    const isLiking = !knowledge.value.liked
    
    if (isLiking) {
      // 点赞
      const success = await communityStore.likeKnowledge(knowledgeId.value)
      if (success) {
        ElMessage.success('点赞成功')
      } else {
        ElMessage.error('点赞失败，请重试')
      }
    } else {
      // 取消点赞
      const success = await communityStore.unlikeKnowledge(knowledgeId.value)
      if (success) {
        ElMessage.success('已取消点赞')
      } else {
        ElMessage.error('取消点赞失败，请重试')
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

// 收藏知识
const toggleCollect = async () => {
  if (!knowledge.value || !knowledgeId.value) return
  
  try {
    const isCollecting = !knowledge.value.collected
    
    // 切换收藏状态
    knowledge.value.collected = isCollecting
    knowledge.value.collectCount = (knowledge.value.collectCount || 0) + (isCollecting ? 1 : -1)
    
    if (isCollecting) {
      // 添加到收藏
      const favoriteItem = {
        id: knowledge.value.id,
        title: knowledge.value.title,
        abstract: knowledge.value.summary || '',
        content: knowledge.value.content || '',
        category: knowledge.value.category || '',
        author: knowledge.value.author?.name || '',
        source: 'community' as const,
        sourceUrl: `/community/detail/${knowledge.value.id}`,
        tags: knowledge.value.tags || [],
        favoriteTime: new Date().toLocaleString()
      }
      
      // 使用store添加收藏
      favoritesStore.addFavorite(favoriteItem)
      ElMessage.success('收藏成功')
    } else {
      // 从收藏中移除
      favoritesStore.removeFavorite(knowledge.value.id, 'community')
      ElMessage.success('已取消收藏')
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

// 格式化时间
const formatTime = (timeString: string | undefined) => {
  if (!timeString) return ''
  
  try {
    const date = new Date(timeString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  } catch (error) {
    return timeString
  }
}

onMounted(() => {
  loadKnowledgeDetail()
  loadComments(true)
})
</script>

<style scoped>
.knowledge-detail-container {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 500;
}

.detail-card {
  margin-bottom: 20px;
}

.knowledge-header {
  margin-bottom: 20px;
}

.knowledge-title {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 15px;
  line-height: 1.4;
}

.knowledge-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 10px;
  color: #606266;
  font-size: 14px;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.tag-item {
  margin-right: 5px;
}

.knowledge-content {
  margin-bottom: 20px;
  line-height: 1.8;
  font-size: 16px;
}

.content-body {
  min-height: 200px;
}

.knowledge-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.3s;
}

.action-item:hover {
  background-color: #f5f7fa;
  color: #409EFF;
}

.action-item.is-active {
  color: #409EFF;
}

/* 点赞图标样式 */
.thumb-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  position: relative;
}

.thumb-up {
  display: block;
  width: 18px;
  height: 18px;
  background: currentColor;
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>');
  -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>');
  mask-size: cover;
  -webkit-mask-size: cover;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  color: #909399;
}

.action-item.is-active .thumb-up,
.thumb-icon.liked .thumb-up {
  color: #409EFF;
}

/* 评论区样式 */
.comments-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 5px;
}

.comment-form {
  margin-bottom: 20px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.comments-list {
  min-height: 100px;
}

.comment-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 15px;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 500;
}

.comment-time {
  color: #909399;
  font-size: 12px;
}

.comment-content {
  margin-bottom: 10px;
  line-height: 1.6;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.replies-list {
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.reply-item {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-avatar {
  flex-shrink: 0;
}

.reply-body {
  flex: 1;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.reply-author {
  font-weight: 500;
  font-size: 14px;
}

.reply-time {
  color: #909399;
  font-size: 12px;
}

.reply-content {
  margin-bottom: 8px;
  line-height: 1.5;
  font-size: 14px;
}

.reply-to {
  color: #409EFF;
  font-weight: 500;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
}

.more-replies {
  text-align: center;
  margin-top: 10px;
  margin-bottom: 10px;
}

.reply-form {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  margin-top: 10px;
}

.comments-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style> 