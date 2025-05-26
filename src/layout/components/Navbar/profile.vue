<template>
  <div class="profile-container">
    <el-card class="profile-card" :body-style="{ padding: '30px' }" v-loading="loading">
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <el-avatar :size="60" :src="avatarUrl" @click="isEditMode && triggerFileInput" :class="{ 'avatar-editable': isEditMode }" />
          <el-button v-if="isEditMode" circle class="edit-avatar" icon="Edit" type="primary" size="small" @click="triggerFileInput"></el-button>
        </div>
        <p v-if="isEditMode">点击头像可以上传本地图片</p>
        <!-- 隐藏的文件输入 -->
        <input
          type="file"
          ref="fileInput"
          style="display: none"
          accept="image/*"
          @change="handleFileChange"
        />
      </div>

      <!-- 图片上传预览对话框 -->
      <el-dialog v-model="dialogVisible" title="头像预览" width="400px" center>
        <div class="avatar-preview">
          <img v-if="tempAvatarUrl" :src="tempAvatarUrl" alt="头像预览" />
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="cancelUpload">取消</el-button>
            <el-button type="primary" @click="confirmUpload">确认</el-button>
          </span>
        </template>
      </el-dialog>

      <el-form label-width="100px" class="profile-form">
        <el-form-item label="用户ID">
          <el-input v-model="profile.id" disabled></el-input>
        </el-form-item>
        
        <el-form-item label="用户名" required>
          <el-input v-model="profile.username" :disabled="!isEditMode"></el-input>
        </el-form-item>
        
        <el-form-item label="密码" required v-if="isEditMode">
          <el-input v-model="profile.password" type="password" show-password placeholder="输入新密码修改，留空则不修改"></el-input>
        </el-form-item>
        
        <el-form-item label="电子邮箱">
          <el-input v-model="profile.email" :disabled="!isEditMode"></el-input>
        </el-form-item>
        
        <el-form-item label="手机号码" required>
          <el-input v-model="profile.phone" :disabled="!isEditMode"></el-input>
        </el-form-item>
        
        <el-form-item label="团队ID">
          <el-input v-model="profile.teamId" disabled></el-input>
        </el-form-item>
        
        <el-form-item label="创建时间">
          <el-input v-model="profile.createTime" disabled></el-input>
        </el-form-item>
        
        <el-form-item label="更新时间">
          <el-input v-model="profile.updateTime" disabled></el-input>
        </el-form-item>
        
        <el-form-item label="用户状态">
          <el-tag :type="profile.status === 1 ? 'success' : 'danger'">
            {{ profile.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </el-form-item>
      
        <el-form-item class="buttons-container">
          <div class="buttons-wrapper">
            <template v-if="!isEditMode">
              <el-button type="primary" @click="enableEditMode">编辑信息</el-button>
              <el-button @click="goBack">返回</el-button>
            </template>
            <template v-else>
              <el-button type="primary" @click="saveProfile" :loading="loading">保存修改</el-button>
              <el-button @click="cancelEdit">取消</el-button>
            </template>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import userStore from '@/store/user';
import { getUserInfo as apiGetUserInfo, updateUserInfo as apiUpdateUserInfo } from '@/api/user';
// 保留request用于头像上传等其他可能的API调用
import request from '@/utils/request81.ts';

const router = useRouter();

// 编辑模式状态
const isEditMode = ref(false);

// 启用编辑模式
const enableEditMode = () => {
  isEditMode.value = true;
};

// 返回首页
const goBack = () => {
  router.push('/layout');
};

// 用户个人信息
const profile = ref({
  id: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  teamId: 0,
  createTime: '',
  updateTime: '',
  status: 1,
  deleteFlag: 0
});

// 备份初始数据，用于取消编辑时恢复
const initialProfile = ref({});

// 加载状态
const loading = ref(false);

// 获取用户信息
const getUserInfo = async () => {
  loading.value = true;
  try {
    const response = await apiGetUserInfo();
    
    if (response.data && response.data.code === 200) {
      const userData = response.data.data;
      console.log('获取到的用户信息:', userData);
      
      // 更新表单数据，使用数据库表字段名称
      profile.value.id = userData.id || userData.user_id || '';
      profile.value.username = userData.username || '';
      profile.value.email = userData.email || '';
      profile.value.phone = userData.phone || '';
      profile.value.teamId = userData.teamId || 0;
      profile.value.createTime = userData.createTime || userData.create_time || '';
      profile.value.updateTime = userData.updateTime || userData.update_time || '';
      profile.value.status = userData.status || 1;
      profile.value.deleteFlag = userData.deleteFlag || userData.delete_flag || 0;
      
      // 不要从API获取密码
      profile.value.password = '';
      
      // 更新头像
      if (userData.avatar) {
        avatarUrl.value = userData.avatar;
      }
      
      // 将用户ID保存到localStorage
      if (userData.id || userData.user_id) {
        const userId = userData.id || userData.user_id;
        localStorage.setItem('uid', userId.toString());
        console.log('已保存用户ID:', userId);
      }

      // 备份初始数据
      initialProfile.value = JSON.parse(JSON.stringify(profile.value));
    } else {
      ElMessage.error('获取用户信息失败');
    }
  } catch (error) {
    console.error('获取用户信息出错', error);
    ElMessage.error('获取用户信息出错');
  } finally {
    loading.value = false;
  }
};

// 组件挂载时获取用户信息
onMounted(() => {
  getUserInfo();
  // 初始状态为非编辑模式
  isEditMode.value = false;
});

// 头像相关
const fileInput = ref<HTMLInputElement | null>(null);
const avatarUrl = ref(userStore.state.avatar); // 使用user store中的头像
const tempAvatarUrl = ref('');
const dialogVisible = ref(false);
const avatarUpdated = ref(false); // 跟踪头像是否已更新

// 触发文件选择
const triggerFileInput = () => {
  if (fileInput.value && isEditMode.value) {
    fileInput.value.click();
  }
};

// 处理文件选择
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    // 检查文件是否为图片
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件');
      return;
    }
    
    // 检查文件大小 (限制为2MB)
    if (file.size > 2 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过2MB');
      return;
    }
    
    // 创建临时URL并显示预览对话框
    tempAvatarUrl.value = URL.createObjectURL(file);
    dialogVisible.value = true;
  }
  
  // 清除输入，以便于再次选择同一文件
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 取消上传
const cancelUpload = () => {
  dialogVisible.value = false;
  // 如果有临时URL，释放它
  if (tempAvatarUrl.value) {
    URL.revokeObjectURL(tempAvatarUrl.value);
    tempAvatarUrl.value = '';
  }
};

// 确认上传
const confirmUpload = async () => {
  // 在实际应用中，这里应该调用API上传图片到服务器
  // 现在我们只是将临时URL设置为当前头像
  avatarUrl.value = tempAvatarUrl.value;
  avatarUpdated.value = true; // 标记头像已更新
  dialogVisible.value = false;
  
  // 直接更新store中的头像，确保实时更新到导航栏
  userStore.updateAvatar(tempAvatarUrl.value);
  
  // 更新localStorage，确保刷新页面后仍能保持
  localStorage.setItem('avatar', tempAvatarUrl.value);
  
  // 触发全局事件，通知其他组件（如导航栏）更新头像
  window.dispatchEvent(new CustomEvent('avatar-updated', { 
    detail: { avatar: tempAvatarUrl.value } 
  }));
  
  ElMessage.success('头像已更新，请点击"保存修改"保存所有更改');
};

const saveProfile = async () => {
  loading.value = true;
  
  // 表单验证
  if (!profile.value.username) {
    ElMessage.warning('用户名不能为空');
    loading.value = false;
    return;
  }
  
  if (!profile.value.phone) {
    ElMessage.warning('手机号码不能为空');
    loading.value = false;
    return;
  }
  
  try {
    // 准备要更新的用户数据
    const userData: any = {
      username: profile.value.username,
      phone: profile.value.phone,
      email: profile.value.email
    };
    
    // 如果密码不为空，则更新密码
    if (profile.value.password) {
      userData.password = profile.value.password;
    }
    
    // 如果头像已更新，添加到更新数据中
    if (avatarUpdated.value) {
      userData.avatar = avatarUrl.value;
    }

    console.log('更新用户信息:', userData);

    // 调用API更新用户信息 - 使用PUT方法和正确的路径
    const response = await request({
      url: '/user/users/settings',
      method: 'put',
      data: userData
    });

    console.log('更新用户信息响应:', response.data);

    if (response.data && response.data.code === 200) {
      // 如果头像已更新，确保store和localStorage都更新
      if (avatarUpdated.value) {
        // 立即更新store中的头像，确保首页立即显示新头像
        userStore.updateAvatar(avatarUrl.value);
        localStorage.setItem('avatar', avatarUrl.value);
        
        // 触发全局事件，通知其他组件更新头像
        window.dispatchEvent(new CustomEvent('avatar-updated', { 
          detail: { avatar: avatarUrl.value } 
        }));
        
        avatarUpdated.value = false; // 重置状态
      }
      
      // 更新store中的用户信息 - 实时更新到导航栏
      userStore.updateUserInfo({
        username: profile.value.username
      });
      
      // 更新localStorage中的用户名
      localStorage.setItem('name', profile.value.username);
      
      // 更新完成后不要立即离开页面，让用户看到成功消息
      ElMessage.success({
        message: '个人信息保存成功',
        duration: 2000
      });
      
      // 重新获取用户信息，确保显示的是最新数据
      setTimeout(() => {
        getUserInfo();
        // 保存成功后退出编辑模式
        isEditMode.value = false;
      }, 1000);
    } else {
      ElMessage.error(response.data?.msg || '保存个人信息失败');
    }
  } catch (error) {
    console.error('保存个人信息出错', error);
    ElMessage.error('保存个人信息出错');
  } finally {
    loading.value = false;
  }
};

const cancelEdit = () => {
  // 如果有临时URL，释放它
  if (tempAvatarUrl.value) {
    URL.revokeObjectURL(tempAvatarUrl.value);
    tempAvatarUrl.value = '';
  }
  
  // 如果头像已被临时更新但未保存，需要恢复
  if (avatarUpdated.value) {
    // 重置头像为store中的值
    avatarUrl.value = userStore.state.avatar;
    avatarUpdated.value = false; // 重置状态
  }
  
  // 恢复到初始数据
  profile.value = JSON.parse(JSON.stringify(initialProfile.value));
  
  // 退出编辑模式
  isEditMode.value = false;
};
</script>

<style scoped>
.profile-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.profile-card {
  width: 500px;
  border-radius: 20px;
}

.avatar-section {
  text-align: center;
  margin-bottom: 30px;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 10px;
}

.avatar-section .el-avatar {
  cursor: default;
}

.avatar-section .avatar-editable {
  cursor: pointer; /* 编辑模式下添加指针样式，提示可点击 */
}

.edit-avatar {
  position: absolute;
  right: -5px;
  bottom: -5px;
  font-size: 12px;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.profile-form .el-form-item {
  margin-bottom: 20px;
}

.profile-form .el-form-item:last-child {
  text-align: center;
  margin-bottom: 0;
}

.avatar-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  overflow: hidden;
}

.avatar-preview img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 50%;
  border: 1px solid #f4f4f7;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.buttons-container {
  margin-top: 30px !important;
  display: flex;
  justify-content: center;
  width: 100%;
}

.buttons-wrapper {
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>