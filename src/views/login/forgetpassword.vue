<template>
  <div class="forget-password-container">
    <div class="forget-password-box">
      <img src="@/assets/wangjimima.png" alt="忘记密码" class="forget-password-image" />
      <h2 class="forget-password-title">忘记密码</h2>
      <p class="forget-password-subtitle">请输入您的注册邮箱，我们会发送重置密码的链接。</p>
      <el-form :model="form" :rules="rules" ref="formRef" class="forget-password-form">
        <el-form-item label="邮箱地址" prop="email">
          <el-input v-model="form.email" placeholder="example@example.com" clearable />
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
              v-model="form.captcha" 
              placeholder="请输入验证码" 
              clearable 
              class="captcha-input"
              style="flex: 1; width: 180px; min-width: 120px; margin-left: auto;"
            />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="submit-button" @click="handleSubmit">发送重置链接</el-button>
        </el-form-item>
      </el-form>
      <el-link :underline="false" class="back-to-login" @click="goToLogin">返回登录</el-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import VerifyCode from '@/components/VerifyCode/index.vue';

const router = useRouter();
const formRef = ref();
const form = ref({
  email: '',
  captcha: ''
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
function validateCaptcha(_rule: any, value: string, callback: any) {
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
}

const rules = ref({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { validator: validateCaptcha, trigger: 'blur' }
  ]
});

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

const handleSubmit = () => {
  formRef.value?.validate((valid: boolean) => {
    if (valid) {
      // 不再需要手动验证验证码，已经在validateCaptcha中验证
      ElMessage.success('重置链接已发送，请检查您的邮箱');
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
.forget-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #eaf4ff;
}

.forget-password-box {
  width: 400px;
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.forget-password-image {
  width: 50px;
  height: auto;
  margin-bottom: 0px;
}

.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.icon {
  width: 48px;
  height: 48px;
  color: #409eff;
}

.forget-password-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.forget-password-subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.submit-button {
  width: 100%;
  height: 40px;
}

.back-to-login {
  display: block;
  margin-top: 20px;
  font-size: 14px;
  border-bottom: none !important;
  color: #409eff;
  cursor: pointer; 
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
</style>