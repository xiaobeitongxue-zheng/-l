import request from '../utils/request81.ts'
import { ref } from 'vue'

export function login(data: any) {
    return request({
    url: '/user/users/login',
    method: 'post',
    data: data
  })
}

export function register(data: any) {
    return request({
    url: '/user/users/register',
    method: 'post',
    data: data
  })
}

export function getUserInfo(data: any) {
  return request({
  url: '/user/users/settings',
  method: 'get',
})
}

export function updateUserInfo(data: any) {
    return request({
    url: '/user/users/settings',
    method: 'put',
    data: data
  })
}

// 状态管理
const state = {
  username: localStorage.getItem('name') || 'Admin',
  avatar: localStorage.getItem('avatar') || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
  token: localStorage.getItem('token') || '',
  role: localStorage.getItem('role') || 'admin'
}

// 更新头像
function updateAvatar(avatar: string) {
  state.avatar = avatar
  localStorage.setItem('avatar', avatar)
}

// 更新用户信息
function updateUserInfoLocal(info: any) {
  if (info.username) {
    state.username = info.username
    localStorage.setItem('name', info.username)
  }
  // 可以添加其他属性的更新
}

// 刷新用户信息
async function refreshUserInfo() {
  try {
    console.log('开始刷新用户信息...')
    const response = await getUserInfo({})
    console.log('获取用户信息响应:', response)
    
    if (response.data && response.data.code === 200) {
      const userData = response.data.data;
      console.log('获取到的用户数据:', userData)
      
      // 更新头像
      if (userData.avatar) {
        state.avatar = userData.avatar
        localStorage.setItem('avatar', userData.avatar)
        console.log('更新用户头像成功')
      }
      
      // 更新用户名
      if (userData.username) {
        state.username = userData.username
        localStorage.setItem('name', userData.username)
        console.log('更新用户名成功:', userData.username)
      }
      
      return userData
    } else {
      console.error('获取用户信息失败，服务器返回错误:', response.data)
      return null
    }
  } catch (error) {
    console.error('刷新用户信息失败:', error)
    return null
  }
}

// 添加默认导出
export default {
  login,
  register,
  updateUserInfo: updateUserInfoLocal,
  updateAvatar,
  refreshUserInfo,
  state
}