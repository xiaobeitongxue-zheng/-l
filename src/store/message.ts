import { ref, computed } from 'vue'
import { getNotificationList, readNotification, deleteNotification } from '@/api/message'

// 定义消息接口，与数据库结构对应
export interface Message {
  id: number;
  receiver_id: number;
  message_content: string;
  message_type: number; // 1-点赞 2-评论 3-收藏
  is_read: boolean;
  create_time: string;
  read_time?: string;
}

// 创建消息状态和方法
const messages = ref<Message[]>([])
const isLoading = ref(false)
const currentPage = ref(0)
const pageSize = ref(10)

// 计算未读消息数量
const unreadCount = computed(() => {
  return messages.value.filter(msg => !msg.is_read).length
})

// 加载消息列表
const loadMessages = async (refresh = false) => {
  if (isLoading.value) return

  isLoading.value = true
  try {
    if (refresh) {
      currentPage.value = 0
    }
    
    const res = await getNotificationList(currentPage.value, pageSize.value)
    if (res.data && res.data.code === 200) {
      if (refresh) {
        messages.value = res.data.data || []
      } else {
        messages.value = [...messages.value, ...(res.data.data || [])]
      }
      
      // 如果返回的数据少于请求的数量，说明已经加载完所有数据
      if ((res.data.data || []).length < pageSize.value) {
        // 没有更多数据了
      } else {
        currentPage.value += pageSize.value
      }
    }
  } catch (error) {
    console.error('加载消息失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 获取消息类型的用户友好名称
const getMessageTypeName = (type: number) => {
  switch (type) {
    case 1: return '点赞'
    case 2: return '评论'
    case 3: return '收藏'
    default: return '通知'
  }
}

// 获取消息图标类型
const getMessageIconType = (type: number) => {
  switch (type) {
    case 1: return 'user' // 点赞
    case 2: return 'user' // 评论
    case 3: return 'user' // 收藏
    default: return 'system'
  }
}

// 标记消息为已读
const markAsRead = async (id: number) => {
  try {
    const res = await readNotification(id)
    if (res.data && res.data.code === 200) {
      const message = messages.value.find(msg => msg.id === id)
      if (message) {
        message.is_read = true
        message.read_time = new Date().toISOString()
      }
      return true
    }
    return false
  } catch (error) {
    console.error('标记消息已读失败:', error)
    return false
  }
}

// 删除消息
const deleteMessage = async (id: number) => {
  try {
    const res = await deleteNotification(id)
    if (res.data && res.data.code === 200) {
      messages.value = messages.value.filter(msg => msg.id !== id)
      return true
    }
    return false
  } catch (error) {
    console.error('删除消息失败:', error)
    return false
  }
}

// 标记所有为已读
const markAllAsRead = async () => {
  const unreadMessages = messages.value.filter(msg => !msg.is_read)
  const promises = unreadMessages.map(msg => markAsRead(msg.id))
  
  try {
    await Promise.all(promises)
    return true
  } catch (error) {
    console.error('标记所有消息已读失败:', error)
    return false
  }
}

// 初始加载
loadMessages(true)

export default {
  messages,
  unreadCount,
  isLoading,
  loadMessages,
  markAsRead,
  deleteMessage,
  markAllAsRead,
  getMessageTypeName,
  getMessageIconType
}