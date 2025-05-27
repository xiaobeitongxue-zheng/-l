<template>
  <div class="community-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>社区知识分享</h2>
    </div>

    <el-row :gutter="20">
      <!-- 左侧内容区 -->
      <el-col :span="18">
        <el-card class="filter-card">
          <el-tabs v-model="activeTab" @tab-click="handleTabClick">
            <el-tab-pane label="全部知识" name="all"></el-tab-pane>
            <el-tab-pane label="我的点赞" name="myLikes"></el-tab-pane>
            <el-tab-pane label="我的收藏" name="myCollections"></el-tab-pane>
          </el-tabs>
        </el-card>

        <!-- 知识列表 -->
        <div class="post-list" v-loading="loading" element-loading-text="正在加载...">
          <template v-if="knowledgeList.length > 0">
            <el-card 
              v-for="item in knowledgeList" 
              :key="item.id" 
              class="post-card" 
              shadow="hover" 
              :data-id="item.id"
            >
              <div class="post-header">
                <div class="post-avatar">
                  <el-avatar :size="40" :src="item.avatar || defaultAvatar"></el-avatar>
                </div>
                <div class="post-info">
                  <div class="post-title">
                    <router-link :to="'/community/detail/' + item.id">{{ item.title || '无标题' }}</router-link>
                  </div>
                  <div class="post-meta">
                    <span class="author">{{ item.author || '匿名用户' }}</span>
                    <span class="time">{{ formatDate(item.createTime) }}</span>
                    <span class="category" v-if="item.category">{{ item.category }}</span>
                  </div>
                </div>
              </div>
              <div class="post-content">{{ item.summary || item.content || '无内容' }}</div>
              <div class="post-tags" v-if="item.tags && item.tags.length">
                <el-tag
                  v-for="tag in item.tags"
                  :key="tag"
                  size="small"
                  effect="plain"
                  class="post-tag"
                >{{ tag }}</el-tag>
              </div>
              <div class="post-actions">
                <div class="action-item">
                  <el-icon><View /></el-icon>
                  <span>{{ item.viewCount || 0 }}</span>
                </div>
                <div class="action-item">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>{{ item.commentCount || 0 }}</span>
                </div>
                <div 
                  class="action-item" 
                  :class="{ 'is-active': item.liked }"
                  @click="toggleLike(item)"
                >
                  <span class="thumb-icon" :class="{ 'liked': item.liked }">
                    <i class="thumb-up"></i>
                  </span>
                  <span>{{ item.likeCount || 0 }}</span>
                </div>
                <div 
                  class="action-item" 
                  :class="{ 'is-active': item.collected }"
                  @click="toggleCollect(item)"
                >
                  <el-icon>
                    <component :is="item.collected ? 'StarFilled' : 'Star'" />
                  </el-icon>
                  <span>{{ item.collectCount || 0 }}</span>
                </div>
              </div>
            </el-card>
          </template>
          <template v-else>
            <el-empty :description="getEmptyDescription()" class="empty-posts">
              <el-button v-if="activeTab !== 'all'" type="primary" @click="activeTab = 'all'">
                浏览全部知识
              </el-button>
            </el-empty>
          </template>
        </div>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-col>

      <!-- 右侧边栏 -->
      <el-col :span="6">
        <!-- 我的收藏夹 -->
        <el-card class="sidebar-card">
          <template #header>
            <div class="card-header">
              <el-icon><component is="Folder" /></el-icon>
              <span>我的收藏夹</span>
              <el-button 
                class="add-folder-btn" 
                type="primary" 
                size="small" 
                circle
                @click="showAddFolderDialog"
              >
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
          </template>
          <div class="folder-list" v-loading="loadingFolders">
            <div 
              v-for="folder in favoritesFolders" 
              :key="folder.id" 
              class="folder-item"
              @click="showFolderItems(folder)"
            >
              <el-icon><component is="Folder" /></el-icon>
              <span class="folder-name">{{ folder.name }}</span>
              <span class="folder-count">{{ folder.itemCount || 0 }}</span>
            </div>
            <el-empty 
              v-if="favoritesFolders.length === 0" 
              description="暂无收藏夹" 
              :image-size="50"
            ></el-empty>
          </div>
        </el-card>
      </el-col>
    </el-row>

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

    <!-- 收藏到文件夹对话框 -->
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
          <el-button type="primary" size="small" @click="showAddFolderDialog(true)">
            创建收藏夹
          </el-button>
        </el-empty>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { 
  EditPen, View, ChatDotRound, Star, StarFilled,
  Folder, Plus, Delete, Edit
} from '@element-plus/icons-vue'
import { 
  getCommunityIndexContent, 
  getCommunityKnowledgeDisplay,
  likeCommunityKnowledge, 
  unlikeCommunityKnowledge,
  addComment,
  getCommentReplies,
  getRootComments,
  addFavouriteFolder,
  addFavouriteItem,
  cancelFavourite,
  deleteFavouriteFolder,
  modifyFavouriteFolder,
  getAllFavouriteFolders,
  getFavouriteItems
} from '@/api/community'

// 路由
const router = useRouter()

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 标签页
const activeTab = ref('all')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 加载状态
const loading = ref(false)
const loadingFolders = ref(false)
const submittingFolder = ref(false)

// 知识列表
const knowledgeList = ref<any[]>([])

// 收藏夹列表
const favoritesFolders = ref<any[]>([])

// 添加收藏夹对话框
const folderDialogVisible = ref(false)
const folderFormRef = ref<FormInstance>()
const folderForm = reactive({
  name: '',
  description: ''
})

// 收藏对话框
const collectDialogVisible = ref(false)
const currentCollectItem = ref<any>(null)

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
  loadKnowledgeList()
  loadFavoritesFolders()
})

// 加载社区知识列表
const loadKnowledgeList = async () => {
  loading.value = true
  try {
    const res = await getCommunityIndexContent((currentPage.value - 1) * pageSize.value, pageSize.value)
    if (res && res.data) {
      // 将返回的数据转换为组件所需格式
      knowledgeList.value = res.data.map((item: any) => {
        return {
          id: item.id,
          title: item.title || '无标题',
          content: item.content,
          summary: item.summary || item.content?.substring(0, 100) || '无内容',
          author: item.authorName || '匿名用户',
          avatar: item.authorAvatar || defaultAvatar,
          createTime: item.createTime,
          updateTime: item.updateTime,
          category: item.category,
          tags: item.tags ? item.tags.split(',') : [],
          viewCount: item.viewCount || 0,
          commentCount: item.commentCount || 0,
          likeCount: item.likeCount || 0,
          collectCount: item.collectCount || 0,
          liked: false,
          collected: false
        }
      })
      total.value = res.data.length || knowledgeList.value.length
      
      // 处理点赞和收藏状态
      // 实际应用中应该从后端获取点赞和收藏状态
    }
  } catch (error) {
    console.error('加载社区知识列表失败:', error)
    ElMessage.error('加载社区知识列表失败')
  } finally {
    loading.value = false
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

// 处理标签页切换
const handleTabClick = () => {
  currentPage.value = 1
  loadKnowledgeList()
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadKnowledgeList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadKnowledgeList()
}

// 获取空状态描述
const getEmptyDescription = () => {
  if (activeTab.value === 'myLikes') {
    return '您还没有点赞过任何知识'
  } else if (activeTab.value === 'myCollections') {
    return '您还没有收藏过任何知识'
  } else {
    return '暂无知识'
  }
}

// 日期格式化
const formatDate = (date: string | number | Date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString()
}

// 点赞/取消点赞
const toggleLike = async (item: any) => {
  try {
    if (item.liked) {
      // 取消点赞
      await unlikeCommunityKnowledge(item.id)
      item.liked = false
      item.likeCount = Math.max(0, (item.likeCount || 0) - 1)
      ElMessage.success('已取消点赞')
    } else {
      // 点赞
      await likeCommunityKnowledge(item.id)
      item.liked = true
      item.likeCount = (item.likeCount || 0) + 1
      ElMessage.success('点赞成功')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

// 显示添加收藏夹对话框
const showAddFolderDialog = (fromCollect = false) => {
  folderForm.name = ''
  folderForm.description = ''
  folderDialogVisible.value = true
  
  // 如果是从收藏对话框打开的，需要关闭收藏对话框
  if (fromCollect) {
    collectDialogVisible.value = false
  }
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
        if (res && res.data) {
          ElMessage.success('收藏夹创建成功')
          folderDialogVisible.value = false
          await loadFavoritesFolders()
          
          // 如果有待收藏的项目，并且创建收藏夹成功，显示收藏对话框
          if (currentCollectItem.value) {
            collectDialogVisible.value = true
          }
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

// 收藏/取消收藏
const toggleCollect = async (item: any) => {
  if (item.collected) {
    // 取消收藏
    try {
      await cancelFavourite(item.id)
      item.collected = false
      item.collectCount = Math.max(0, (item.collectCount || 0) - 1)
      ElMessage.success('已取消收藏')
    } catch (error) {
      console.error('取消收藏失败:', error)
      ElMessage.error('取消收藏失败，请重试')
    }
  } else {
    // 添加收藏
    currentCollectItem.value = item
    // 显示收藏对话框
    collectDialogVisible.value = true
  }
}

// 添加到指定收藏夹
const addToFolder = async (folderId: number) => {
  if (!currentCollectItem.value) return
  
  try {
    await addFavouriteItem(currentCollectItem.value.id, folderId)
    currentCollectItem.value.collected = true
    currentCollectItem.value.collectCount = (currentCollectItem.value.collectCount || 0) + 1
    collectDialogVisible.value = false
    currentCollectItem.value = null
    ElMessage.success('收藏成功')
  } catch (error) {
    console.error('添加到收藏夹失败:', error)
    ElMessage.error('添加到收藏夹失败，请重试')
  }
}

// 显示收藏夹中的内容
const showFolderItems = async (folder: any) => {
  try {
    const res = await getFavouriteItems(folder.id)
    if (res && res.data) {
      ElMessage.info(`${folder.name}中有${res.data.length}个项目`)
      // 实际应用中应该跳转到收藏夹详情页或者弹出收藏夹内容列表
    }
  } catch (error) {
    console.error('获取收藏夹内容失败:', error)
    ElMessage.error('获取收藏夹内容失败')
  }
}
</script>

<style scoped>
.community-container {
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

.filter-card {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.post-list {
  margin-bottom: 20px;
}

.post-card {
  margin-bottom: 15px;
}

.post-header {
  display: flex;
  margin-bottom: 10px;
}

.post-avatar {
  margin-right: 15px;
}

.post-info {
  flex: 1;
}

.post-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.post-title a {
  color: #303133;
  text-decoration: none;
  margin-right: 10px;
}

.post-title a:hover {
  color: #409EFF;
}

.post-meta {
  display: flex;
  font-size: 13px;
  color: #909399;
  margin-bottom: 5px;
}

.post-meta span {
  margin-right: 15px;
}

.post-content {
  margin-bottom: 10px;
  color: #606266;
  line-height: 1.6;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
}

.post-tag {
  margin-right: 5px;
}

.post-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  color: #909399;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.action-item:hover {
  color: #409EFF;
}

.action-item.is-active {
  color: #409EFF;
  font-weight: 600;
}

.action-item .el-icon {
  font-size: 16px;
}

/* 点赞图标样式 */
.thumb-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-right: 2px;
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

.action-item.is-active .thumb-icon {
  transform: scale(1.2);
  transition: transform 0.2s ease;
}

.like-animation {
  animation: like-bounce 0.5s;
}

@keyframes like-bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.4);
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 20px;
}

.sidebar-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
}

.add-folder-btn {
  margin-left: auto;
}

.folder-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.folder-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.folder-item:hover {
  background-color: #f5f7fa;
}

.folder-name {
  margin-left: 8px;
  flex: 1;
}

.folder-count {
  color: #909399;
  font-size: 12px;
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
</style> 
