<template>
  <div class="message-center-container">
    <div class="page-header">
      <h2>消息中心</h2>
      <div class="header-actions">
        <el-button 
          type="primary" 
          @click="markAllAsRead" 
          :disabled="!hasUnreadMessages || isLoading"
        >
          全部标为已读
        </el-button>
      </div>
    </div>

    <el-card v-loading="isLoading">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="全部消息" name="all">
          <message-list 
            :messages="displayMessages" 
            @read="handleMarkAsRead" 
            @delete="handleDeleteMessage"
          />
        </el-tab-pane>
        <el-tab-pane label="未读消息" name="unread">
          <message-list 
            :messages="unreadMessages" 
            @read="handleMarkAsRead" 
            @delete="handleDeleteMessage"
          />
        </el-tab-pane>
        <el-tab-pane label="已读消息" name="read">
          <message-list 
            :messages="readMessages" 
            @read="handleMarkAsRead" 
            @delete="handleDeleteMessage"
          />
        </el-tab-pane>
      </el-tabs>

      <div class="load-more" v-if="displayMessages.length > 0">
        <el-button 
          v-if="hasMore" 
          type="primary" 
          link 
          @click="loadMoreMessages" 
          :loading="isLoading"
        >
          加载更多
        </el-button>
        <el-empty v-else description="没有更多消息了" :image-size="60" />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import MessageList from '@/components/message/MessageList.vue'
import { getNotificationList, readNotification, deleteNotification } from '@/api/message'

// 消息接口定义，与数据库结构对应
interface Message {
  id: number;
  receiver_id: number;
  message_content: string;
  message_type: number; // 1-点赞 2-评论 3-收藏
  is_read: boolean;
  create_time: string;
  read_time?: string;
  deleted?: number; // 逻辑删除标志 0-未删除 1-已删除
}

// 状态
const messages = ref<Message[]>([])
const isLoading = ref(false)
const startIndex = ref(0)
const pageSize = ref(10)
const hasMore = ref(true)
const activeTab = ref('all')

// 计算属性
const readMessages = computed(() => {
  return messages.value.filter(msg => msg.is_read)
})

const unreadMessages = computed(() => {
  return messages.value.filter(msg => !msg.is_read)
})

const hasUnreadMessages = computed(() => {
  return unreadMessages.value.length > 0
})

const displayMessages = computed(() => {
  switch (activeTab.value) {
    case 'unread':
      return unreadMessages.value
    case 'read':
      return readMessages.value
    default:
      return messages.value
  }
})

// 加载消息
const loadMessages = async (refresh = false) => {
  if (isLoading.value) return

  isLoading.value = true
  try {
    if (refresh) {
      startIndex.value = 0
      messages.value = []
    }

    const res = await getNotificationList(startIndex.value, pageSize.value)
    if (res.data && res.data.code === 200) {
      const newMessages = res.data.data || []
      
      if (refresh) {
        messages.value = newMessages
      } else {
        messages.value = [...messages.value, ...newMessages]
      }
      
      // 更新分页信息
      startIndex.value += newMessages.length
      hasMore.value = newMessages.length >= pageSize.value
    } else {
      ElMessage.error(res.data?.msg || '获取消息失败')
    }
  } catch (error) {
    console.error('加载消息失败:', error)
    ElMessage.error('网络错误，获取消息失败')
  } finally {
    isLoading.value = false
  }
}

// 加载更多消息
const loadMoreMessages = () => {
  loadMessages(false)
}

// 标记消息为已读
const handleMarkAsRead = async (id: number) => {
  try {
    const res = await readNotification(id)
    if (res.data && res.data.code === 200) {
      const messageIndex = messages.value.findIndex(msg => msg.id === id)
      if (messageIndex !== -1) {
        messages.value[messageIndex].is_read = true
        messages.value[messageIndex].read_time = new Date().toISOString()
        ElMessage.success('已标记为已读')
      }
    } else {
      ElMessage.error(res.data?.msg || '操作失败')
    }
  } catch (error) {
    console.error('标记已读失败:', error)
    ElMessage.error('网络错误，操作失败')
  }
}

// 标记所有消息为已读
const markAllAsRead = async () => {
  if (!hasUnreadMessages.value) return
  
  try {
    ElMessageBox.confirm(
      '确定将所有未读消息标记为已读吗？',
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      const promises = unreadMessages.value.map(msg => handleMarkAsRead(msg.id))
      await Promise.all(promises)
      ElMessage.success('所有消息已标记为已读')
    }).catch(() => {
      // 用户取消操作
    })
  } catch (error) {
    console.error('批量标记已读失败:', error)
    ElMessage.error('操作失败')
  }
}

// 删除消息
const handleDeleteMessage = async (id: number) => {
  try {
    const res = await deleteNotification(id)
    if (res.data && res.data.code === 200) {
      messages.value = messages.value.filter(msg => msg.id !== id)
      ElMessage.success('删除成功')
    } else {
      ElMessage.error(res.data?.msg || '删除失败')
    }
  } catch (error) {
    console.error('删除消息失败:', error)
    ElMessage.error('网络错误，删除失败')
  }
}

// 初始加载
onMounted(() => {
  loadMessages(true)
})
</script>

<style scoped>
.message-center-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 10px 0;
}

:deep(.el-tabs__nav) {
  margin-bottom: 15px;
}

:deep(.el-empty) {
  padding: 20px 0;
}
</style></style>
