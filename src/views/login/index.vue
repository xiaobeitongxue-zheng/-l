<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>欢迎登录企业知识库系统</h2>
      </div>
        
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username"
            placeholder="用户名"
            prefix-icon="User"
            clearable
            style="height: 34px;"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
            style="height: 34px;"
          />
        </el-form-item>

        <el-form-item prop="captcha">
          <div class="captcha-section">
            <verify-code 
              ref="verifyCodeRef"
              :type="1" 
              :codeLength="4" 
              :fontSize="26"
              :height="40"
              :width="110"
              :showInput="false"
              @success="onVerifySuccess" 
              @error="onVerifyError"
              style="position: absolute; left: 0;"
            />
            <el-input 
              v-model="loginForm.captcha" 
              placeholder="请输入验证码" 
              clearable 
              class="captcha-input" 
              style="flex: 1; width: 180px; min-width: 120px; margin-left: auto;"
            />
          </div>
        </el-form-item>
        
        <el-form-item>
          <div class="form-options" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <el-checkbox v-model="loginForm.remember">记住密码</el-checkbox>
            <el-link type="primary" :underline="false" @click="goToForgetPassword">忘记密码</el-link>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            class="login-button" 
            @click="handleLogin"
            :disabled="!isFormValid"
          >
            登录
          </el-button>
        </el-form-item>
        
        <el-form-item>
          <div class="register-link" style="text-align: center; width: 100%;">
            <span>还没有账号?</span>
            <el-link type="primary" :underline="false" @click="goToRegister">注册账号</el-link>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { validUsername } from '@/utils/validate'
import { login } from '@/api/user'
import { setToken, setName, setUserId } from '@/utils/auth'
import VerifyCode from '@/components/VerifyCode/index.vue'

const router = useRouter()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  remember: false
})

// 验证码相关
interface VerifyCodeInstance {
  refreshCaptcha: () => VerifyCodeInstance;
  getCode: () => string;
  validate: (value?: string) => boolean;
}

const verifyCodeRef = ref<VerifyCodeInstance | null>(null);
const verifyCodeValue = ref('');  // 存储当前验证码的值

// 验证码校验函数
const validateCaptcha = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入验证码'));
  } else if (verifyCodeRef.value) {
    // 手动验证验证码
    const isValid = verifyCodeRef.value.validate(value);
    if (!isValid) {
      callback(new Error('验证码错误'));
    } else {
      callback();
    }
  } else {
    callback();
  }
};

// 刷新验证码
const refreshCaptcha = () => {
  if (verifyCodeRef.value) {
    verifyCodeRef.value.refreshCaptcha();
  }
}

// 验证码成功回调
const onVerifySuccess = (obj: any) => {
  verifyCodeValue.value = obj.options?.code || '';
  console.log('验证码验证成功');
}

// 验证码错误回调
const onVerifyError = (obj: any) => {
  console.log('验证码验证错误');
  refreshCaptcha();
}

// 组件挂载时不再需要手动生成验证码
onMounted(() => {
  // 验证码组件会自动生成验证码
});

const loginRules: FormRules = {
  username: [
    { required: true, trigger: 'blur', message: '请输入用户名' },
    { validator: (_rule, value, callback) => {
      if (!validUsername(value)) {
        callback(new Error('请输入正确的用户名'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  password: [
    { required: true, trigger: 'blur', message: '请输入密码' },
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
  ],
  captcha: [
    { required: true, trigger: 'blur', message: '请输入验证码' },
    { validator: validateCaptcha, trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    
    // 不再需要手动验证验证码，已经在validateCaptcha中验证
    
    loading.value = true
    console.log('准备登录，用户名:', loginForm.username)
    
    // 调用登录接口，只传用户名和密码
    login({
      username: loginForm.username,
      password: loginForm.password
    }).then(async response => {
      loading.value = false
      console.log('登录响应:', response)
      
      if (response.data && response.data.code === 200) {
        // 登录成功，保存token和用户信息
        const data = response.data.data
        console.log('登录成功数据:', data)
        setToken(data.token)
        
        // 获取完整的用户信息
        try {
          // 导入getUserInfo
          const { getUserInfo } = await import('@/api/user')
          const userInfoResponse = await getUserInfo()
          
          if (userInfoResponse.data && userInfoResponse.data.code === 200) {
            const userData = userInfoResponse.data.data
            console.log('获取到的用户信息:', userData)
            
            // 更新用户信息
            if (userData.username) {
              setName(userData.username)
            } else {
              setName(loginForm.username as string)
            }
            
            // 更新头像
            if (userData.avatar) {
              localStorage.setItem('avatar', userData.avatar)
            }
            
            // 保存用户ID
            if (userData.id || userData.user_id) {
              const userId = userData.id || userData.user_id
              console.log('保存用户ID:', userId)
              setUserId(userId.toString())
              
              // 直接保存到localStorage，确保能被其他页面访问
              localStorage.setItem('uid', userId.toString())
            }
          } else {
            // 如果获取用户信息失败，使用登录时的基本信息
            setName(loginForm.username as string)
            
            // 保存用户ID
            if (data.uid || data.userId) {
              const userId = data.uid || data.userId
              console.log('保存用户ID:', userId)
              setUserId(userId.toString())
              localStorage.setItem('uid', userId.toString())
            }
          }
        } catch (error) {
          console.error('获取用户信息失败:', error)
          // 如果获取用户信息失败，使用登录时的基本信息
          setName(loginForm.username as string)
          
          // 保存用户ID
          if (data.uid || data.userId) {
            const userId = data.uid || data.userId
            console.log('保存用户ID:', userId)
            setUserId(userId.toString())
            localStorage.setItem('uid', userId.toString())
          }
        }
        
        // 显示成功消息并立即跳转到首页
        ElMessage({
          message: '登录成功',
          type: 'success',
          duration: 1000,
          showClose: false
        })
        
        // 确认token已正确存储到localStorage
        console.log('登录成功，Token已设置:', localStorage.getItem('token'))
        
        // 修改跳转方式，使用location.href直接跳转，强制刷新页面
        window.location.href = '/layout'
      } else {
        // 登录失败
        console.error('登录失败:', response.data)
        
        if (response.data && response.data.msg) {
          ElMessage({
            message: response.data.msg,
            type: 'error',
            duration: 3000
          })
        } else {
          ElMessage({
            message: '登录失败，请检查账户和密码',
            type: 'error',
            duration: 3000
          })
        }
        
        // 刷新验证码
        refreshCaptcha()
      }
    }).catch(error => {
      loading.value = false
      console.error('登录请求失败:', error)
      
      // 提供更详细的错误信息
      if (error.response) {
        console.error('服务器响应错误:', error.response.data)
        ElMessage({
          message: `登录失败: ${error.response.data?.msg || error.message || '服务器错误'}`,
          type: 'error',
          duration: 3000
        })
      } else if (error.request) {
        console.error('服务器无响应:', error.request)
        ElMessage({
          message: '登录失败: 服务器无响应，请检查网络连接',
          type: 'error',
          duration: 3000
        })
      } else {
        console.error('请求配置错误:', error.message)
        ElMessage({
          message: `登录失败: ${error.message}`,
          type: 'error',
          duration: 3000
        })
      }
      
      // 刷新验证码
      refreshCaptcha()
    })
  } catch (error) {
    console.error('登录验证失败', error)
    loading.value = false
    ElMessage({
      message: '请输入正确的信息',
      type: 'warning',
      duration: 2000
    })
    // 刷新验证码
    refreshCaptcha()
  }
}

const goToForgetPassword = () => {
  router.push('/forgetpassword');
};

const goToRegister = () => {
  router.push('/register');
};

// 计算属性：判断表单是否有效
const isFormValid = computed(() => {
  const { username, password, captcha } = loginForm
  // 用户名、密码和验证码都必须填写
  const hasRequiredFields = username.trim() !== '' && password.trim() !== '' && captcha.trim() !== ''
  // 用户名必须有效
  const isUsernameValid = validUsername(username)
  // 密码长度至少为6位
  const isPasswordValid = password.length >= 6
  
  return hasRequiredFields && isUsernameValid && isPasswordValid
})
</script>

<style scoped>
.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.login-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('@/assets/login.jpg') no-repeat center center;
  background-size: cover;
  filter: blur(4px);
  z-index: -1;
  transform: scale(1.05); /* 稍微放大以避免模糊后边缘出现空白 */
}

.login-box {
  width: 280px;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.9); /* 增加半透明效果 */
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15); /* 增强阴影效果 */
  position: relative; /* 修改为相对定位 */
  z-index: 1; /* 确保在背景图之上 */
  
}

.login-header {
  text-align: center;
  margin-bottom: 20px;
}

.login-header h2 {
  font-size: 20px;
  color: #303133;
  margin: 0;
}

.login-form {
  margin-top: 10px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 15px; /* 从17px改为10px */
  position: relative; /* 确保相对定位 */
}

.login-form :deep(.el-form-item__error) {
  position: absolute;
  left: 0;
  bottom: -20px; /* 移动到表单项下方 */
  z-index: 2; /* 确保错误信息在最上层 */
  width: 100%;
  text-align: left;
  padding: 0;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.captcha-section {
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
  margin-bottom: 5px;
  height: 40px;
  padding-left: 120px; /* 为验证码图片预留空间 */
  box-sizing: border-box;
}

.captcha-image-container {
  height: 34px;
  width: 100px;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 0 5px rgba(0,0,0,0.1);
  display: flex;
  justify-content: center;
  align-items: center;
}

.captcha-image-container canvas {
  display: block;
}

.captcha-input {
  height: 34px;
  width: 100%;
}

.login-button {
  width: 100%;
  margin-top: 2px;
}

.register-link {
  text-align: center;
  margin-top: 5px;
}
</style>