<template>
  <div class="team-info-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>团队基本信息</span>
          <div class="header-actions" v-if="isAdmin">
            <el-button type="primary" size="small" @click="showEditDialog">
              <el-icon><Edit /></el-icon> 编辑信息
            </el-button>
            <el-popconfirm
              title="确定要解散该团队吗？此操作不可恢复！"
              @confirm="handleDeleteTeam"
              confirm-button-text="确定"
              cancel-button-text="取消"
            >
              <template #reference>
                <el-button type="danger" size="small">
                  <el-icon><Delete /></el-icon> 解散团队
                </el-button>
              </template>
            </el-popconfirm>
          </div>
          <el-button v-else type="danger" size="small" @click="handleExitTeam">
            <el-icon><CircleClose /></el-icon> 退出团队
          </el-button>
        </div>
      </template>

      <div class="info-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="团队ID">{{ team.id }}</el-descriptions-item>
          <el-descriptions-item label="团队名称">{{ team.teamName }}</el-descriptions-item>
          <el-descriptions-item label="创建者">{{ team.creatorName || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ team.createTime }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="team.status === 1 ? 'success' : 'info'">
              {{ team.status === 1 ? '公开' : '私有' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="成员数量">{{ teamMemberCount }}</el-descriptions-item>
          <el-descriptions-item label="团队介绍" :span="2">
            {{ team.description || '暂无介绍' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- 编辑团队信息对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑团队信息"
      width="500px"
    >
      <el-form
        ref="teamFormRef"
        :model="teamForm"
        :rules="teamRules"
        label-width="100px"
      >
        <el-form-item label="团队名称" prop="teamName">
          <el-input v-model="teamForm.teamName" placeholder="请输入团队名称"></el-input>
        </el-form-item>
        <el-form-item label="团队介绍" prop="description">
          <el-input 
            v-model="teamForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入团队介绍"
          ></el-input>
        </el-form-item>
        <el-form-item label="团队状态" prop="status">
          <el-radio-group v-model="teamForm.status">
            <el-radio :label="1">公开</el-radio>
            <el-radio :label="0">私有</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTeamEdit" :loading="submitting">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, CircleClose } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { updateTeam, getTeamMembers, exitTeam, deleteTeam } from '@/api/team'

const props = defineProps({
  team: {
    type: Object,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh'])

// 状态
const submitting = ref(false)
const editDialogVisible = ref(false)
const teamMembers = ref<any[]>([])
const teamMemberCount = ref(0)

// 表单引用
const teamFormRef = ref<FormInstance>()

// 表单数据
const teamForm = reactive({
  id: 0,
  teamName: '',
  description: '',
  status: 1
})

// 表单校验规则
const teamRules = reactive<FormRules>({
  teamName: [
    { required: true, message: '请输入团队名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
  ]
})

// 显示编辑对话框
const showEditDialog = () => {
  teamForm.id = props.team.id
  teamForm.teamName = props.team.teamName
  teamForm.description = props.team.description || ''
  teamForm.status = props.team.status || 1
  editDialogVisible.value = true
}

// 提交编辑表单
const submitTeamEdit = async () => {
  if (!teamFormRef.value) return
  
  await teamFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const res = await updateTeam({
        id: teamForm.id,
        teamName: teamForm.teamName,
        description: teamForm.description,
        status: teamForm.status
      })
      
      if (res.data && res.data.code === 200) {
        ElMessage.success('更新团队信息成功')
        editDialogVisible.value = false
        emit('refresh') // 通知父组件刷新
      } else {
        ElMessage.error(res.data?.msg || '更新团队信息失败')
      }
    } catch (error) {
      console.error('更新团队信息出错:', error)
      ElMessage.error('网络错误，更新团队信息失败')
    } finally {
      submitting.value = false
    }
  })
}

// 退出团队
const handleExitTeam = async () => {
  ElMessageBox.confirm(
    '确定要退出该团队吗？',
    '退出确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await exitTeam()
      if (res.data && res.data.code === 200) {
        ElMessage.success('退出团队成功')
        emit('refresh') // 通知父组件刷新
      } else {
        ElMessage.error(res.data?.msg || '退出团队失败')
      }
    } catch (error) {
      console.error('退出团队出错:', error)
      ElMessage.error('网络错误，退出团队失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 解散团队
const handleDeleteTeam = async () => {
  try {
    const res = await deleteTeam(props.team.id)
    if (res.data && res.data.code === 200) {
      ElMessage.success('解散团队成功')
      emit('refresh') // 通知父组件刷新
    } else {
      ElMessage.error(res.data?.msg || '解散团队失败')
    }
  } catch (error) {
    console.error('解散团队出错:', error)
    ElMessage.error('网络错误，解散团队失败')
  }
}

// 获取团队成员
const fetchTeamMembers = async () => {
  try {
    const res = await getTeamMembers(props.team.id)
    if (res.data && res.data.code === 200) {
      teamMembers.value = res.data.data || []
      teamMemberCount.value = teamMembers.value.length
    }
  } catch (error) {
    console.error('获取团队成员出错:', error)
  }
}

// 组件挂载时获取团队成员
onMounted(() => {
  fetchTeamMembers()
})
</script>

<style scoped>
.team-info-container {
  padding: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.info-content {
  margin-top: 20px;
}
</style> 