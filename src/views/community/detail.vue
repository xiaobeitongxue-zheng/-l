<template>
  <div class="knowledge-detail-container" v-loading="loading">
    <div class="back-link">
      <el-button text @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回列表
      </el-button>
    </div>
    
    <el-card v-if="knowledgeDetail" class="detail-card">
      <div class="knowledge-header">
        <h1 class="knowledge-title">{{ knowledgeDetail.title }}</h1>
        <div class="knowledge-meta">
          <div class="knowledge-author">
            <el-avatar :size="32" :src="knowledgeDetail.avatar || defaultAvatar"></el-avatar>
            <span>{{ knowledgeDetail.author }}</span>
          </div>
          <div class="knowledge-info">
            <span class="info-item">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(knowledgeDetail.createTime) }}
            </span>
            <span class="info-item">
              <el-icon><View /></el-icon>
              {{ knowledgeDetail.viewCount || 0 }}
            </span>
            <span class="info-item">
              <el-icon><ChatDotRound /></el-icon>
              {{ knowledgeDetail.commentCount || 0 }}
            </span>
          </div>
          <div class="knowledge-actions">
            <el-button 
              :type="knowledgeDetail.liked ? 'primary' : 'default'"
              size="small"
              @click="toggleLike"
            >
              <template #icon>
                <el-icon><component :is="knowledgeDetail.liked ? 'StarFilled' : 'Star'" /></el-icon>
              </template>
              {{ knowledgeDetail.liked ? '已点赞' : '点赞' }} ({{ knowledgeDetail.likeCount || 0 }})
            </el-button>
            <el-button 
              :type="knowledgeDetail.collected ? 'warning' : 'default'"
              size="small"
              @click="toggleCollect"
            >
              <template #icon>
                <el-icon><component :is="knowledgeDetail.collected ? 'StarFilled' : 'Star'" /></el-icon>
              </template>
              {{ knowledgeDetail.collected ? '已收藏' : '收藏' }} ({{ knowledgeDetail.collectCount || 0 }})
            </el-button>
          </div>
        </div>
        <div class="knowledge-tags" v-if="knowledgeDetail.tags && knowledgeDetail.tags.length">
          <el-tag 
            v-for="tag in knowledgeDetail.tags" 
            :key="tag" 
            class="tag-item"
            effect="plain"
          >{{ tag }}</el-tag>
        </div>
      </div>
      
      <div class="knowledge-content">
        {{ knowledgeDetail.content }}
      </div>
    </el-card>
    
    <!-- 评论区 -->
    <el-card class="comments-card">
      <template #header>
        <div class="card-header">
          <span>评论 ({{ comments.length }})</span>
        </div>
      </template>
      
      <!-- 发表评论 -->
      <div class="comment-form">
        <el-input
          v-model="commentContent"
          type="textarea"
          :rows="3"
          placeholder="发表你的评论..."
          maxlength="1000"
          show-word-limit
        ></el-input>
        <div class="form-actions">
          <el-button type="primary" @click="submitComment" :loading="submittingComment">
            发表评论
          </el-button>
        </div>
      </div>
      
      <!-- 评论列表 -->
      <div class="comment-list" v-if="comments.length > 0">
        <div 
          v-for="comment in comments" 
          :key="comment.id" 
          class="comment-item"
          :class="{'reply-comment': comment.level > 1}"
        >
          <div class="comment-user">
            <el-avatar :size="36" :src="comment.avatar || defaultAvatar"></el-avatar>
          </div>
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-author">{{ comment.author }}</span>
              <span class="comment-time">{{ formatDate(comment.createTime) }}</span>
            </div>
            <div class="comment-text">{{ comment.content }}</div>
            <div class="comment-actions">
              <span class="action-link" @click="replyToComment(comment)">回复</span>
            </div>
            
            <!-- 回复输入框 -->
            <div class="reply-form" v-if="comment.showReplyForm">
              <el-input
                v-model="comment.replyContent"
                type="textarea"
                :rows="2"
                placeholder="回复评论..."
                maxlength="500"
                show-word-limit
              ></el-input>
              <div class="form-actions">
                <el-button size="small" @click="cancelReply(comment)">取消</el-button>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="submitReply(comment)" 
                  :loading="comment.submitting"
                >回复</el-button>
              </div>
            </div>
            
            <!-- 加载更多回复 -->
            <div 
              v-if="comment.hasMoreReplies" 
              class="load-more-replies"
              @click="loadMoreReplies(comment)"
            >
              <span>查看更多回复</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 没有评论时 -->
      <el-empty 
        v-else 
        description="暂无评论，发表第一条评论吧"
        :image-size="80"
      ></el-empty>
      
      <!-- 分页 -->
      <div class="pagination" v-if="total > pageSize">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
    
    <!-- 收藏对话框 -->
    <el-dialog
      v-model="collectDialogVisible"
      title="添加到收藏夹"
      width="400px"
    >
      <div class="select-folder-list" v-loading="loadingFolders">
        <div 
          v-for="folder in favoritesFolders" 
          :key="folder.id" 
          class="select-folder-item"
          @click="addToFolder(folder.id)"
        >
          <el-icon><component is="Folder" /></el-icon>
          <span class="folder-name">{{ folder.name }}</span>
        </div>
        <el-empty 
          v-if="favoritesFolders.length === 0" 
          description="暂无收藏夹，请先创建" 
          :image-size="50"
        >
          <el-button type="primary" size="small" @click="showAddFolderDialog">
            创建收藏夹
          </el-button>
        </el-empty>
      </div>
    </el-dialog>
    
    <!-- 添加收藏夹对话框 -->
    <el-dialog
      v-model="folderDialogVisible"
      title="添加收藏夹"
      width="400px"
    >
      <el-form :model="folderForm" :rules="folderRules" ref="folderFormRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="folderForm.name" placeholder="请输入收藏夹名称"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="folderForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入收藏夹描述"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="folderDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitFolder" :loading="submittingFolder">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { 
  ArrowLeft, Calendar, View, ChatDotRound, 
  Star, StarFilled, Folder, ArrowDown
} from '@element-plus/icons-vue'
import { 
  getCommunityKnowledgeDisplay,
  likeCommunityKnowledge, 
  unlikeCommunityKnowledge,
  addComment,
  getCommentReplies,
  getRootComments,
  addFavouriteFolder,
  addFavouriteItem,
  cancelFavourite,
  getAllFavouriteFolders
} from '@/api/community'

const route = useRoute()
const router = useRouter()
const knowledgeId = computed(() => Number(route.params.id))

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 加载状态
const loading = ref(false)
const loadingFolders = ref(false)
const submittingComment = ref(false)
const submittingFolder = ref(false)

// 知识详情
const knowledgeDetail = ref<any>(null)

// 评论相关
const commentContent = ref('')
const comments = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 收藏相关
const collectDialogVisible = ref(false)
const folderDialogVisible = ref(false)
const favoritesFolders = ref<any[]>([])
const folderFormRef = ref<FormInstance>()
const folderForm = reactive({
  name: '',
  description: ''
})

// 收藏夹表单验证规则
const folderRules: FormRules = {
  name: [
    { required: true, message: '请输入收藏夹名称', trigger: 'blur' },
    { min: 2, max: 20, message: '名称长度在2-20个字符之间', trigger: 'blur' }
  ],
  description: [
    { max: 100, message: '描述不能超过100个字符', trigger: 'blur' }
  ]
}

// 初始化
onMounted(() => {
  if (knowledgeId.value) {
    loadKnowledgeDetail()
    loadComments()
    loadFavoritesFolders()
  }
})

// 加载知识详情
const loadKnowledgeDetail = async () => {
  loading.value = true
  try {
    const res = await getCommunityKnowledgeDisplay(knowledgeId.value)
    if (res && res.data) {
      // 格式化数据
      knowledgeDetail.value = {
        id: res.data.id,
        title: res.data.title || '无标题',
        content: res.data.content || '无内容',
        author: res.data.authorName || '匿名用户',
        avatar: res.data.authorAvatar || defaultAvatar,
        createTime: res.data.createTime,
        updateTime: res.data.updateTime,
        tags: res.data.tags ? res.data.tags.split(',') : [],
        viewCount: res.data.viewCount || 0,
        commentCount: res.data.commentCount || 0,
        likeCount: res.data.likeCount || 0,
        collectCount: res.data.collectCount || 0,
        liked: false, // 假设默认未点赞，实际应从后端获取
        collected: false // 假设默认未收藏，实际应从后端获取
      }
    }
  } catch (error) {
    console.error('加载知识详情失败:', error)
    ElMessage.error('加载知识详情失败')
  } finally {
    loading.value = false
  }
}

// 加载评论
const loadComments = async () => {
  try {
    const startIndex = (currentPage.value - 1) * pageSize.value
    const res = await getRootComments(knowledgeId.value, startIndex, pageSize.value)
    if (res && res.data) {
      // 格式化评论数据
      comments.value = res.data.map((comment: any) => {
        return {
          id: comment.id,
          content: comment.content,
          author: comment.authorName || '匿名用户',
          avatar: comment.authorAvatar || defaultAvatar,
          createTime: comment.createTime,
          parentId: comment.parentId,
          level: comment.level || 1,
          replyCount: comment.replyCount || 0,
          showReplyForm: false,
          replyContent: '',
          submitting: false,
          hasMoreReplies: comment.replyCount > 0,
          replies: []
        }
      })
      total.value = res.data.length || 0 // 修改为使用数据长度
    }
  } catch (error) {
    console.error('加载评论失败:', error)
    ElMessage.error('加载评论失败')
  }
}

// 加载收藏夹列表
const loadFavoritesFolders = async () => {
  loadingFolders.value = true
  try {
    const res = await getAllFavouriteFolders()
    if (res && res.data) {
      favoritesFolders.value = res.data.map((folder: any) => {
        return {
          id: folder.id,
          name: folder.name,
          description: folder.description,
          itemCount: folder.itemCount || 0
        }
      })
    }
  } catch (error) {
    console.error('加载收藏夹列表失败:', error)
    ElMessage.error('加载收藏夹列表失败')
  } finally {
    loadingFolders.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 日期格式化
const formatDate = (date: string | number | Date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString()
}

// 评论分页
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadComments()
}

// 点赞/取消点赞
const toggleLike = async () => {
  if (!knowledgeDetail.value) return
  
  try {
    if (knowledgeDetail.value.liked) {
      // 取消点赞
      await unlikeCommunityKnowledge(knowledgeDetail.value.id)
      knowledgeDetail.value.liked = false
      knowledgeDetail.value.likeCount = Math.max(0, knowledgeDetail.value.likeCount - 1)
      ElMessage.success('已取消点赞')
    } else {
      // 点赞
      await likeCommunityKnowledge(knowledgeDetail.value.id)
      knowledgeDetail.value.liked = true
      knowledgeDetail.value.likeCount = knowledgeDetail.value.likeCount + 1
      ElMessage.success('点赞成功')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

// 收藏/取消收藏
const toggleCollect = async () => {
  if (!knowledgeDetail.value) return
  
  if (knowledgeDetail.value.collected) {
    // 取消收藏
    try {
      await cancelFavourite(knowledgeDetail.value.id)
      knowledgeDetail.value.collected = false
      knowledgeDetail.value.collectCount = Math.max(0, knowledgeDetail.value.collectCount - 1)
      ElMessage.success('已取消收藏')
    } catch (error) {
      console.error('取消收藏失败:', error)
      ElMessage.error('取消收藏失败，请重试')
    }
  } else {
    // 显示收藏对话框
    collectDialogVisible.value = true
  }
}

// 显示添加收藏夹对话框
const showAddFolderDialog = () => {
  folderForm.name = ''
  folderForm.description = ''
  folderDialogVisible.value = true
  collectDialogVisible.value = false
}

// 提交添加收藏夹
const submitFolder = async () => {
  if (!folderFormRef.value) return
  
  await folderFormRef.value.validate(async (valid) => {
    if (valid) {
      submittingFolder.value = true
      try {
        const res = await addFavouriteFolder({
          name: folderForm.name,
          description: folderForm.description
        })
        if (res && res.data) { // 修改条件判断
          ElMessage.success('收藏夹创建成功')
          folderDialogVisible.value = false
          await loadFavoritesFolders()
          collectDialogVisible.value = true
        }
      } catch (error) {
        console.error('创建收藏夹失败:', error)
        ElMessage.error('创建收藏夹失败，请重试')
      } finally {
        submittingFolder.value = false
      }
    }
  })
}

// 添加到指定收藏夹
const addToFolder = async (folderId: number) => {
  if (!knowledgeDetail.value) return
  
  try {
    await addFavouriteItem(knowledgeDetail.value.id, folderId)
    knowledgeDetail.value.collected = true
    knowledgeDetail.value.collectCount = knowledgeDetail.value.collectCount + 1
    collectDialogVisible.value = false
    ElMessage.success('收藏成功')
  } catch (error) {
    console.error('添加到收藏夹失败:', error)
    ElMessage.error('添加到收藏夹失败，请重试')
  }
}

// 提交评论
const submitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('评论内容不能为空')
    return
  }
  
  submittingComment.value = true
  try {
    const res = await addComment({
      communityKnowledgeId: knowledgeId.value,
      content: commentContent.value,
      parentId: 0, // 顶级评论
      targetCommentId: 0 // 没有特定目标评论
    })
    
    if (res && res.data) { // 修改条件判断
      ElMessage.success('评论发表成功')
      commentContent.value = ''
      // 刷新评论列表
      loadComments()
      // 更新评论数
      if (knowledgeDetail.value) {
        knowledgeDetail.value.commentCount = (knowledgeDetail.value.commentCount || 0) + 1
      }
    }
  } catch (error) {
    console.error('发表评论失败:', error)
    ElMessage.error('发表评论失败，请重试')
  } finally {
    submittingComment.value = false
  }
}

// 回复评论
const replyToComment = (comment: any) => {
  // 先关闭所有其他回复框
  comments.value.forEach(c => {
    c.showReplyForm = false
  })
  // 打开当前评论的回复框
  comment.showReplyForm = true
  comment.replyContent = ''
}

// 取消回复
const cancelReply = (comment: any) => {
  comment.showReplyForm = false
  comment.replyContent = ''
}

// 提交回复
const submitReply = async (comment: any) => {
  if (!comment.replyContent.trim()) {
    ElMessage.warning('回复内容不能为空')
    return
  }
  
  comment.submitting = true
  try {
    const res = await addComment({
      communityKnowledgeId: knowledgeId.value,
      content: comment.replyContent,
      parentId: comment.id,
      targetCommentId: comment.id
    })
    
    if (res && res.data) { // 修改条件判断
      ElMessage.success('回复发表成功')
      comment.showReplyForm = false
      comment.replyContent = ''
      // 增加回复计数
      comment.replyCount = (comment.replyCount || 0) + 1
      comment.hasMoreReplies = true
      // 更新评论数
      if (knowledgeDetail.value) {
        knowledgeDetail.value.commentCount = (knowledgeDetail.value.commentCount || 0) + 1
      }
      // 可选：加载最新回复
      loadRepliesForComment(comment)
    }
  } catch (error) {
    console.error('发表回复失败:', error)
    ElMessage.error('发表回复失败，请重试')
  } finally {
    comment.submitting = false
  }
}

// 加载更多回复
const loadMoreReplies = (comment: any) => {
  loadRepliesForComment(comment)
}

// 为指定评论加载回复
const loadRepliesForComment = async (comment: any) => {
  try {
    const res = await getCommentReplies(comment.id, 0, 10) // 加载前10条回复
    if (res && res.data) {
      // 格式化回复数据
      const replies = res.data.map((reply: any) => {
        return {
          id: reply.id,
          content: reply.content,
          author: reply.authorName || '匿名用户',
          avatar: reply.authorAvatar || defaultAvatar,
          createTime: reply.createTime,
          parentId: reply.parentId,
          level: 2, // 回复都是二级评论
          replyContent: '',
          submitting: false,
          showReplyForm: false
        }
      })
      
      // 更新评论的回复列表
      comment.replies = replies
      comment.hasMoreReplies = comment.replyCount > replies.length
    }
  } catch (error) {
    console.error('加载回复失败:', error)
    ElMessage.error('加载回复失败，请重试')
  }
}
</script>

<style scoped>
.knowledge-detail-container {
  padding: 20px;
}

.back-link {
  margin-bottom: 20px;
}

.detail-card {
  margin-bottom: 20px;
}

.knowledge-header {
  margin-bottom: 30px;
}

.knowledge-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #303133;
}

.knowledge-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.knowledge-author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.knowledge-info {
  display: flex;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
}

.knowledge-actions {
  display: flex;
  gap: 10px;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.knowledge-content {
  font-size: 16px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
}

.comments-card {
  margin-bottom: 30px;
}

.card-header {
  font-size: 18px;
  font-weight: 500;
}

.comment-form {
  margin-bottom: 30px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.comment-list {
  margin-top: 20px;
}

.comment-item {
  display: flex;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #EBEEF5;
}

.comment-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.reply-comment {
  margin-left: 40px;
  background-color: #F9FAFC;
  padding: 15px;
  border-radius: 8px;
}

.comment-user {
  margin-right: 15px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 500;
  margin-right: 10px;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-text {
  margin-bottom: 10px;
  line-height: 1.6;
}

.comment-actions {
  display: flex;
  gap: 15px;
}

.action-link {
  color: #409EFF;
  cursor: pointer;
  font-size: 14px;
}

.action-link:hover {
  text-decoration: underline;
}

.reply-form {
  margin-top: 15px;
  margin-bottom: 15px;
  background-color: #F9FAFC;
  padding: 15px;
  border-radius: 8px;
}

.load-more-replies {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  color: #409EFF;
  cursor: pointer;
}

.load-more-replies:hover {
  text-decoration: underline;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.select-folder-list {
  max-height: 300px;
  overflow-y: auto;
}

.select-folder-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.select-folder-item:hover {
  background-color: #f5f7fa;
}

.folder-name {
  margin-left: 8px;
}
</style> 