<template>
  <div class="register-container">
    <div class="register-box">
      <h2 class="register-title">注册新账号</h2>
      <p class="register-subtitle">请填写以下信息完成注册</p>

      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" class="register-form" label-position="top">
        <div class="form-item-wrapper">
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名"
              prefix-icon="User"
              clearable
              class="custom-input"
            />
          </el-form-item>
        </div>

        <div class="form-item-wrapper">
          <el-form-item prop="email">
            <el-input
              v-model="registerForm.email"
              placeholder="请输入邮箱"
              prefix-icon="Message"
              clearable
              class="custom-input"
            />
          </el-form-item>
        </div>

        <div class="form-item-wrapper">
          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              show-password
              clearable
              class="custom-input"
            />
          </el-form-item>
        </div>

        <div class="form-item-wrapper">
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请确认密码"
              prefix-icon="Lock"
              show-password
              clearable
              class="custom-input"
            />
          </el-form-item>
        </div>

        <div class="form-item-wrapper">
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
                v-model="registerForm.captcha" 
                placeholder="请输入验证码" 
                clearable 
                class="captcha-input" 
                style="flex: 1; width: 180px; min-width: 120px; margin-left: auto;"
              />
            </div>
          </el-form-item>
        </div>

        <div class="form-item-wrapper">
          <div class="button-group">
            <el-button type="primary" class="register-button" :loading="loading" @click="handleRegister">
              注册
            </el-button>
            <el-button class="cancel-button" @click="goToLogin">
              取消
            </el-button>
          </div>
        </div>

        <div class="register-links">
          <el-link type="primary" :underline="false" @click="goToLogin">已有账号？登录</el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { register } from '@/api/user'; // 导入注册接口
import VerifyCode from '@/components/VerifyCode/index.vue'

const router = useRouter();
const registerFormRef = ref();
const loading = ref(false); // 添加加载状态

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  captcha: '',
});

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

const registerRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string) => {
        if (value !== registerForm.password) {
          return new Error('两次输入的密码不一致');
        }
        return true;
      },
      trigger: 'blur',
    },
  ],
  captcha: [
    { required: true, trigger: 'blur', message: '请输入验证码' },
    { validator: validateCaptcha, trigger: 'blur' }
  ],
};

const handleRegister = () => {
  registerFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      loading.value = true; // 设置加载状态
      
      // 不再需要手动验证验证码，已经在validateCaptcha中验证
      
      // 调用注册接口
      register({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        captcha: registerForm.captcha
      }).then(response => {
        loading.value = false;
        
        if (response.data && response.data.code === 200) {
          ElMessage.success('注册成功');
          // 延迟跳转，让用户看到成功消息
          setTimeout(() => {
            router.push('/login');
          }, 1500);
        } else {
          // 注册失败
          ElMessage.error(response.data?.message || '注册失败，请稍后重试');
        }
      }).catch(error => {
        loading.value = false;
        console.error('注册请求失败', error);
        ElMessage.error('注册失败，请稍后重试');
        // 刷新验证码
        refreshCaptcha();
      });
    } else {
      ElMessage.error('请检查表单填写是否正确');
    }
  });
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #eaf4ff;
}

.register-box {
  width: 400px;
  padding: 25px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  transform: scale(0.85);
  transform-origin: center center;
}

.register-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
}

.register-subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.custom-input {
  width: 80%;
  margin: 0 auto;
}

/* 修复验证错误信息的样式 */
:deep(.el-form-item__error) {
  position: static !important;
  display: block;
  margin: 2px auto 0;
  width: 80%;
  text-align: left;
  padding: 0;
}

.captcha-container {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
}

.captcha-input {
  flex: 1;
  max-width: calc(100% - 110px); /* 110px = 图片宽度100px + 间距10px */
}

.captcha-image {
  width: 100px;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  background-color: white;
  box-sizing: border-box;
}

.captcha-form-item {
  width: 80% !important;
  box-sizing: border-box;
}

/* 确保验证码容器占据整个表单项宽度 */
.captcha-container {
  width: 100% !important;
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
}

/* 确保验证码输入框宽度正确 */
.captcha-input {
  width: calc(100% - 110px) !important;
  flex: none !important; /* 禁用flex拉伸 */
}

/* 调整表单项内部布局 */
.register-form :deep(.el-form-item__content) {
  width: 100%;
  display: flex;
  justify-content: center;
}

/* 确保验证码部分的样式一致 */
.captcha-form-item :deep(.el-form-item__content) {
  width: 100%;
}

/* 让外层容器保持一致的宽度 */
.form-item-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

/* 让所有表单项宽度一致 */
.register-form :deep(.el-form-item) {
  width: 80%;
  margin-bottom: 0;
  box-sizing: border-box;
}

.register-button {
  width: 70px;
  height: 40px;
}

.cancel-button {
  width: 70px;
  height: 40px;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 10px;
  width: 80%;
  margin: 0 auto;
}

.register-links {
  margin-top: 10px;
}

.register-links :deep(.el-link) {
  text-decoration: none !important;
}

.register-form :deep(.el-form-item__error) {
  text-align: left;
  padding: 0;
}

/* 统一所有输入框样式 */
.custom-input, .captcha-input {
  width: 100%;
  box-sizing: border-box;
}

/* 添加验证码容器样式 */
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
</style>