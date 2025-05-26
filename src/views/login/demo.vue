<template>
  <div class="demo-container">
    <h1>验证码演示</h1>
    
    <div class="demo-section">
      <h3>1. 字母数字混合验证码</h3>
      <verify-code 
        :type="1" 
        :codeLength="4" 
        :fontSize="26"
        :height="40"
        :width="160"
        @success="handleSuccess" 
        @error="handleError"
      />
    </div>
    
    <div class="demo-section">
      <h3>2. 纯数字验证码</h3>
      <verify-code 
        :type="2" 
        :codeLength="6" 
        :fontSize="26"
        :height="40"
        :width="160"
        @success="handleSuccess" 
        @error="handleError"
      />
    </div>
    
    <div class="demo-section">
      <h3>3. 纯字母验证码</h3>
      <verify-code 
        :type="3" 
        :codeLength="4" 
        :fontSize="26"
        :height="40"
        :width="160"
        @success="handleSuccess" 
        @error="handleError"
      />
    </div>
    
    <div class="demo-section">
      <h3>4. 自定义样式验证码</h3>
      <div class="custom-captcha-container">
        <verify-code 
          ref="customVerifyRef"
          :type="1" 
          :codeLength="5"
          :fontSize="30"
          :height="50"
          :width="200"
          :showInput="false"
          @success="handleSuccess" 
          @error="handleError"
          style="position: absolute; left: 0;"
        />
        <el-input 
          v-model="customInput" 
          placeholder="请输入上方验证码"
          class="custom-input"
          style="width: 200px; min-width: 160px; margin-left: auto;"
        />
      </div>
      <el-button 
        type="primary" 
        @click="validateCustom" 
        style="margin-top: 10px;"
      >
        验证
      </el-button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import VerifyCode from '@/components/VerifyCode/index.vue'

export default {
  name: 'VerifyDemo',
  components: {
    VerifyCode
  },
  setup() {
    const customInput = ref('');
    const customVerifyRef = ref(null);
    
    const handleSuccess = (obj) => {
      ElMessage.success('验证成功！')
      console.log('验证成功:', obj)
    }

    const handleError = (obj) => {
      ElMessage.error('验证失败！')
      console.log('验证失败:', obj)
    }
    
    const validateCustom = () => {
      const customVerify = customVerifyRef.value;
      if (customVerify) {
        const isValid = customVerify.validate(customInput.value);
        if (isValid) {
          ElMessage.success('验证成功！');
        } else {
          ElMessage.error('验证失败！');
        }
      }
    }

    return {
      customInput,
      customVerifyRef,
      handleSuccess,
      handleError,
      validateCustom
    }
  }
}
</script>

<style scoped>
.demo-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.demo-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.custom-input {
  max-width: 200px;
}

.custom-captcha-container {
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
  margin-bottom: 10px;
  height: 50px;
  padding-left: 210px; /* 为验证码图片预留更大空间 */
  box-sizing: border-box;
}
</style> 