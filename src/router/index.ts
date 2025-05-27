import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import userStore from '@/store/user'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue')
  },
  {
    path: '/forgetpassword',
    name: 'ForgetPassword',
    component: () => import('@/views/login/forgetpassword.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/login/register.vue')
  },
  {
    path: '/verify-demo',
    name: 'VerifyDemo',
    component: () => import('@/views/login/demo.vue')
  },
  {
    path: '/layout',
    name: 'Layout',
    component: () => import('@/layout/Layout.vue'),
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: '首页', icon: 'home' }
      },
      {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/layout/components/Navbar/profile.vue'),
        meta: { title: '个人资料', icon: 'el-icon-user', requireAuth: true }
      },
      {
        path: '/knowledge',
        name: 'Knowledge',
        component: () => import('@/views/knowledge/index.vue'),
        meta: { title: '知识管理', icon: 'el-icon-folder', requireAuth: true }
      },
      {
        path: '/user',
        name: 'UserService',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户服务', icon: 'User' },
        redirect: '/user/management',
        children: [
          {
            path: '/user/management',
            name: 'UserManagement',
            component: () => import('@/views/user/management/index.vue'),
            meta: { title: '用户管理' }
          },
          {
            path: '/user/permission',
            name: 'PermissionManagement',
            component: () => import('@/views/user/permission/index.vue'),
            meta: { title: '权限管理' }
          }
        ]
      },
      {
        path: '/team',
        name: 'TeamService',
        component: () => import('@/views/team/TeamHome.vue'),
        meta: { title: '团队空间', icon: 'UserFilled' }
      },
      {
        path: '/team-knowledge',
        name: 'TeamKnowledge',
        component: () => import('@/views/knowledge/index.vue'),
        meta: { title: '团队知识库' }
      },
      {
        path: '/community',
        name: 'Community',
        component: () => import('@/views/community/index.vue'),
        meta: { title: '社区知识', icon: 'community' }
      },
      {
        path: '/community/detail/:id',
        name: 'CommunityDetail',
        component: () => import('@/views/community/detail.vue'),
        meta: { title: '知识详情', icon: 'document', activeMenu: '/community' }
      },
      {
        path: '/personal',
        name: 'PersonalKnowledgeBase',
        component: () => import('@/views/personal/index.vue'),
        meta: { title: '个人知识库', icon: 'Promotion' }
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  // 获取token
  const token = localStorage.getItem('token')
  
  console.log('路由守卫检查token:', token)
  console.log('当前路由:', to.path, '来源路由:', from.path)
  
  // 如果是访问登录页、注册页或忘记密码页，不需要验证token
  if (to.path === '/login' || to.path === '/register' || to.path === '/forgetpassword' || to.path === '/verify-demo') {
    next()
  } else {
    // 如果有token，放行
    if (token) {
      console.log('有token，放行')
      
      // 从登录页直接访问首页时的特殊处理
      if ((to.path === '/home' || to.path === '/layout') && from.path === '/login') {
        console.log('从登录页跳转到首页，获取最新用户信息')
        try {
          await userStore.refreshUserInfo()
          console.log('用户信息刷新成功')
          if (to.path === '/home') {
            // 如果直接访问/home，确保它通过/layout加载
            next('/layout')
            return
          }
        } catch (error) {
          console.error('路由守卫中更新用户信息失败:', error)
        }
      }
      
      next()
    } else {
      // 没有token，重定向到登录页
      console.log('无token，重定向到登录页')
      next('/login')
    }
  }
})

export default router