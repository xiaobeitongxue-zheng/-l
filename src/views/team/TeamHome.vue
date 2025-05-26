<template>
  <div class="team-home-container">
    <!-- 团队列表页面 -->
    <div v-if="!activeTeamId">
      <div class="page-header">
        <h2>所有团队</h2>
        <div class="header-actions" v-if="!hasTeam">
          <el-button type="primary" @click="showCreateTeamDialog">
            <el-icon><Plus /></el-icon> 创建团队
          </el-button>
          <el-button @click="showJoinTeamDialog">
            <el-icon><Connection /></el-icon> 加入团队
          </el-button>
        </div>
      </div>
      
      <el-card v-loading="loadingTeams" class="teams-card">
        <el-empty v-if="teamList.length === 0" description="暂无团队"></el-empty>
        <div v-else class="teams-grid">
          <el-card 
            v-for="team in teamList" 
            :key="team.id" 
            class="team-item"
            shadow="hover"
            @click="handleTeamSelect(team.id.toString())"
          >
            <div class="team-item-content">
              <div class="team-info">
                <el-icon class="team-icon"><UserFilled /></el-icon>
                <div class="team-details">
                  <span class="team-name">{{ team.teamName }}</span>
                  <div class="team-status">
                    <el-tag size="small" type="success" v-if="isTeamAdmin(team)">管理员</el-tag>
                    <el-tag size="small" v-else>成员</el-tag>
                    <el-tag size="small" type="info" v-if="team.status === 0">私有</el-tag>
                    <el-tag size="small" type="warning" v-else>公开</el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </el-card>
    </div>
    
    <!-- 团队详情页面 -->
    <div v-else>
      <div class="page-header">
        <div class="page-title">
          <el-button @click="backToTeamList" size="small">
            <el-icon><Back /></el-icon> 返回
          </el-button>
          <h2>{{ activeTeam?.teamName }}</h2>
        </div>
      </div>
      
      <el-tabs v-model="activeTab" class="team-tabs">
        <el-tab-pane label="团队信息" name="info">
          <team-info :team="activeTeam" :is-admin="isTeamAdmin(activeTeam)" @refresh="fetchTeamList" />
        </el-tab-pane>
        <el-tab-pane label="成员管理" name="members">
          <team-members :team-id="activeTeamId" :is-admin="isTeamAdmin(activeTeam)" @refresh="fetchTeamList" />
        </el-tab-pane>
        <el-tab-pane label="加入申请" name="applications" v-if="isTeamAdmin(activeTeam)">
          <team-applications :team-id="activeTeamId" @refresh="fetchTeamList" />
        </el-tab-pane>
        <el-tab-pane label="团队知识库" name="knowledge">
          <team-knowledge :team-id="activeTeamId" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 创建团队对话框 -->
    <el-dialog
      v-model="createTeamDialogVisible"
      title="创建新团队"
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
        <el-form-item label="团队描述" prop="description">
          <el-input 
            v-model="teamForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入团队描述"
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
          <el-button @click="createTeamDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreateTeam" :loading="submittingTeam">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 加入团队对话框 -->
    <el-dialog
      v-model="joinTeamDialogVisible"
      title="申请加入团队"
      width="500px"
    >
      <el-form
        ref="joinTeamFormRef"
        :model="joinTeamForm"
        :rules="joinTeamRules"
        label-width="100px"
      >
        <el-form-item label="团队ID" prop="teamId">
          <el-input v-model="joinTeamForm.teamId" placeholder="请输入团队ID"></el-input>
        </el-form-item>
        <el-form-item label="申请信息" prop="applyMessage">
          <el-input 
            v-model="joinTeamForm.applyMessage" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入申请信息"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="joinTeamDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitJoinTeam" :loading="submittingJoin">
            提交申请
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Connection, UserFilled, Back } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { getTeamList, createTeam, applyForJoinTeam } from '@/api/team'

// 引入子组件
import TeamInfo from './components/TeamInfo.vue'
import TeamMembers from './components/TeamMembers.vue'
import TeamApplications from './components/TeamApplications.vue'
import TeamKnowledge from './components/TeamKnowledge.vue'

// 状态
const loadingTeams = ref(false)
const submittingTeam = ref(false)
const submittingJoin = ref(false)
const teamList = ref<any[]>([])
const activeTeamId = ref<number | null>(null)
const activeTab = ref('info')

// 对话框状态
const createTeamDialogVisible = ref(false)
const joinTeamDialogVisible = ref(false)

// 表单引用
const teamFormRef = ref<FormInstance>()
const joinTeamFormRef = ref<FormInstance>()

// 表单数据
const teamForm = reactive({
  teamName: '',
  description: '',
  status: 1
})

const joinTeamForm = reactive({
  teamId: '',
  applyMessage: ''
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

const joinTeamRules = reactive<FormRules>({
  teamId: [
    { required: true, message: '请输入团队ID', trigger: 'blur' }
  ],
  applyMessage: [
    { max: 200, message: '申请信息不能超过200个字符', trigger: 'blur' }
  ]
})

// 计算属性 - 当前选中的团队
const activeTeam = computed(() => {
  if (!activeTeamId.value) return null
  return teamList.value.find(team => team.id === activeTeamId.value) || null
})

// 计算属性 - 用户是否已有团队
const hasTeam = computed(() => {
  return teamList.value.length > 0
})

// 判断用户是否为团队管理员
const isTeamAdmin = (team: any) => {
  const userId = parseInt(localStorage.getItem('uid') || '0')
  return team && team.creator === userId
}

// 获取团队列表
const fetchTeamList = async () => {
  console.log('开始获取团队列表')
  loadingTeams.value = true
  try {
    const res = await getTeamList()
    console.log('获取团队列表响应:', res)
    if (res.data && res.data.code === 200) {
      teamList.value = res.data.data || []
      console.log('解析后的团队列表:', teamList.value)
    } else {
      console.error('获取团队列表API错误:', res.data)
      ElMessage.error(res.data?.msg || '获取团队列表失败')
    }
  } catch (error) {
    console.error('获取团队列表出错:', error)
    ElMessage.error('网络错误，获取团队列表失败')
  } finally {
    loadingTeams.value = false
  }
}

// 选择团队
const handleTeamSelect = (index: string) => {
  activeTeamId.value = parseInt(index)
}

// 返回团队列表
const backToTeamList = () => {
  activeTeamId.value = null
}

// 显示创建团队对话框
const showCreateTeamDialog = () => {
  // 重置表单
  teamForm.teamName = ''
  teamForm.description = ''
  teamForm.status = 1
  createTeamDialogVisible.value = true
}

// 显示加入团队对话框
const showJoinTeamDialog = () => {
  // 重置表单
  joinTeamForm.teamId = ''
  joinTeamForm.applyMessage = ''
  joinTeamDialogVisible.value = true
}

// 提交创建团队
const submitCreateTeam = async () => {
  if (!teamFormRef.value) return
  
  await teamFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submittingTeam.value = true
    try {
      console.log('提交创建团队请求:', teamForm)
      const res = await createTeam({
        teamName: teamForm.teamName,
        description: teamForm.description,
        status: teamForm.status
      })
      
      console.log('创建团队响应:', res)
      if (res.data && res.data.code === 200) {
        ElMessage.success('创建团队成功')
        createTeamDialogVisible.value = false
        // 延迟一点再刷新团队列表，确保服务器已处理完毕
        setTimeout(() => {
          fetchTeamList() // 刷新团队列表
        }, 500)
      } else {
        // 检查是否包含特定错误消息
        if (res.data?.msg && res.data.msg.includes('当前团队已有成员')) {
          // 这可能是因为后端有问题，尝试刷新团队列表并继续
          ElMessage.warning('创建过程中遇到问题，但团队可能已创建成功。正在刷新列表...')
          createTeamDialogVisible.value = false
          setTimeout(() => {
            fetchTeamList() // 刷新团队列表
          }, 500)
        } else {
          // 一般错误
          ElMessage.error(res.data?.msg || '创建团队失败')
        }
      }
    } catch (error) {
      console.error('创建团队出错，完整错误:', error)
      ElMessage.error('网络错误，创建团队失败')
    } finally {
      submittingTeam.value = false
    }
  })
}

// 提交加入团队申请
const submitJoinTeam = async () => {
  if (!joinTeamFormRef.value) return
  
  await joinTeamFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submittingJoin.value = true
    try {
      const res = await applyForJoinTeam({
        teamId: parseInt(joinTeamForm.teamId),
        applyMessage: joinTeamForm.applyMessage,
        type: 2 // 用户申请加入
      })
      
      if (res.data && res.data.code === 200) {
        ElMessage.success('申请已提交，请等待管理员审核')
        joinTeamDialogVisible.value = false
      } else {
        ElMessage.error(res.data?.msg || '提交申请失败')
      }
    } catch (error) {
      console.error('提交申请出错:', error)
      ElMessage.error('网络错误，提交申请失败')
    } finally {
      submittingJoin.value = false
    }
  })
}

// 组件挂载时获取团队列表
onMounted(() => {
  fetchTeamList()
})
</script>

<style scoped>
.team-home-container {
  padding: 15px;
  height: 100%;
  overflow: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-title h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.teams-card {
  margin-bottom: 20px;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 10px;
}

.team-item {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.team-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.team-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.team-info {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;
}

.team-icon {
  font-size: 24px;
  color: #409EFF;
}

.team-details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.team-name {
  font-size: 16px;
  font-weight: 500;
}

.team-status {
  display: flex;
  gap: 5px;
  margin-top: 5px;
}

.team-tabs {
  background-color: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

@media (max-height: 800px) {
  .team-home-container {
    padding: 10px;
  }
  
  .teams-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
  
  :deep(.el-tabs__header) {
    margin-bottom: 10px;
  }
  
  :deep(.el-tab-pane) {
    max-height: calc(100vh - 160px);
    overflow-y: auto;
  }
  
  .el-dialog {
    max-height: 90vh;
    overflow-y: auto;
  }
}

@media (max-width: 768px) {
  .teams-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style> 