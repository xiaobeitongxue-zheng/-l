import request from '@/utils/request81.ts'

// 获取消息列表
export function getNotificationList(startIndex: number, num?: number) {
  return request({
    url: '/user/notification',
    method: 'post',
    data: {
      startIndex,
      num: num || 10
    }
  })
}

// 标记消息为已读
export function readNotification(messageId: number) {
  return request({
    url: '/user/notification/read',
    method: 'post',
    data: {
      messageId
    }
  })
}

