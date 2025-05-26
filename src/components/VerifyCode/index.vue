<template>
  <div class="verify-code-container">
    <div class="captcha-section">
      <div class="captcha-image-container" @click="refreshCaptcha" title="点击刷新验证码">
        <canvas ref="captchaCanvas" :width="width" :height="height"></canvas>
      </div>
      <div v-if="showInput" class="captcha-input-wrapper">
        <slot name="input">
          <input 
            v-model="inputValue" 
            type="text" 
            class="captcha-input" 
            placeholder="请输入验证码"
            @blur="validateCaptcha"
          >
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VerifyCode',
  props: {
    // 验证码类型: 1=字母数字,2=纯数字,3=纯字母
    type: {
      type: Number,
      default: 1
    },
    // 宽度
    width: {
      type: [String, Number],
      default: 120
    },
    // 高度
    height: {
      type: [String, Number],
      default: 40
    },
    // 字体大小
    fontSize: {
      type: [String, Number],
      default: 25
    },
    // 验证码长度
    codeLength: {
      type: Number,
      default: 4
    },
    // 是否显示输入框
    showInput: {
      type: Boolean,
      default: true
    },
    // 自动验证
    autoValidate: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      captchaCode: '', // 当前验证码值
      inputValue: '',  // 用户输入值
      ready: false     // 组件是否就绪
    }
  },
  mounted() {
    this.generateCaptcha();
    this.ready = true;
    this.$emit('ready', this);
  },
  methods: {
    // 生成随机字符
    generateRandomChar() {
      let chars = '';
      
      // 根据类型选择字符集
      if (this.type === 1) {
        // 字母数字混合 (去掉容易混淆的字符 0OIl1)
        chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      } else if (this.type === 2) {
        // 纯数字
        chars = '0123456789';
      } else if (this.type === 3) {
        // 纯字母 (去掉容易混淆的字符 OIl)
        chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
      }
      
      return chars.charAt(Math.floor(Math.random() * chars.length));
    },
    
    // 生成随机颜色
    generateRandomColor(min, max) {
      const r = Math.floor(Math.random() * (max - min) + min);
      const g = Math.floor(Math.random() * (max - min) + min);
      const b = Math.floor(Math.random() * (max - min) + min);
      return `rgb(${r},${g},${b})`;
    },
    
    // 生成验证码
    generateCaptcha() {
      const canvas = this.$refs.captchaCanvas;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const width = parseInt(this.width);
      const height = parseInt(this.height);
      
      // 清空画布
      ctx.clearRect(0, 0, width, height);
      
      // 设置背景色
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, width, height);
      
      // 生成验证码字符
      let code = '';
      for (let i = 0; i < this.codeLength; i++) {
        const char = this.generateRandomChar();
        code += char;
        
        // 设置字体
        const fontSize = parseInt(this.fontSize) + Math.floor(Math.random() * 6); // 字体大小随机变化
        ctx.font = `bold ${fontSize}px Arial`;
        
        // 随机旋转角度
        const rotation = (Math.random() * 0.4 - 0.2); // -0.2 到 0.2 弧度
        
        // 设置填充颜色
        ctx.fillStyle = this.generateRandomColor(10, 120); // 深色字符
        
        // 绘制字符
        ctx.save();
        ctx.translate(width / this.codeLength * i + width / (this.codeLength * 2), height / 2); // 将字符居中
        ctx.rotate(rotation);
        ctx.fillText(char, 0, 0);
        ctx.restore();
      }
      
      // 添加干扰线
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = this.generateRandomColor(150, 200);
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // 添加干扰点
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = this.generateRandomColor(150, 200);
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, 1, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // 保存验证码
      this.captchaCode = code;
      console.log('生成的验证码:', code);
      
      // 清空输入
      this.inputValue = '';
      
      // 发出验证码生成事件
      this.$emit('captcha-generated', code);
    },
    
    // 刷新验证码
    refreshCaptcha() {
      this.generateCaptcha();
      return this;
    },
    
    // 获取验证码值
    getCode() {
      return this.captchaCode;
    },
    
    // 验证用户输入
    validateCaptcha() {
      if (!this.autoValidate) return;
      
      const userInput = this.inputValue.trim();
      
      if (!userInput) {
        this.$emit('error', { message: '请输入验证码', userTriggered: true });
        return false;
      }
      
      // 忽略大小写进行比较
      const isValid = userInput.toUpperCase() === this.captchaCode.toUpperCase();
      
      if (isValid) {
        this.$emit('success', { 
          code: this.captchaCode, 
          input: userInput,
          userTriggered: true
        });
      } else {
        this.$emit('error', { 
          message: '验证码错误', 
          code: this.captchaCode, 
          input: userInput,
          userTriggered: true
        });
        this.refreshCaptcha();
      }
      
      return isValid;
    },
    
    // 手动验证
    validate(value) {
      if (!value) value = this.inputValue.trim();
      
      if (!value) {
        this.$emit('error', { message: '请输入验证码', userTriggered: false });
        return false;
      }
      
      // 忽略大小写进行比较
      const isValid = value.toUpperCase() === this.captchaCode.toUpperCase();
      
      if (isValid) {
        this.$emit('success', { 
          code: this.captchaCode, 
          input: value,
          userTriggered: false
        });
      } else {
        this.$emit('error', { 
          message: '验证码错误', 
          code: this.captchaCode, 
          input: value,
          userTriggered: false
        });
        this.refreshCaptcha();
      }
      
      return isValid;
    }
  }
}
</script>

<style scoped>
.verify-code-container {
  width: 100%;
  margin: 10px 0;
}

.captcha-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.captcha-image-container {
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
  max-width: 100%;
}

.captcha-input-wrapper {
  flex: 1;
  min-width: 120px;
}

.captcha-input {
  width: 100%;
  height: 40px;
  padding: 0 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
  box-sizing: border-box;
}

.captcha-input:focus {
  border-color: #409eff;
}

/* 添加媒体查询，适应小屏幕 */
@media (max-width: 768px) {
  .captcha-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .captcha-input-wrapper {
    width: 100%;
  }
}
</style> 