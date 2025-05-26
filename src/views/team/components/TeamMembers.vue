<template>
  <div class="team-members-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>团队成员管理</span>
          <el-button type="primary" size="small" @click="showAddMemberDialog" v-if="isAdmin">
            <el-icon><Plus /></el-icon> 添加成员
          </el-button>
        </div>
      </template>

      <div v-loading="loading">
        <el-table :data="members" style="width: 100%" border>
          <el-table-column prop="userId" label="用户ID" width="80" />
          <el-table-column prop="userName" label="用户名" min-width="120" />
          <el-table-column label="角色" width="120">
            <template #default="{ row }">
              <el-tag :type="row.roleId === 2 ? 'success' : 'info'">
                {{ row.roleId === 2 ? '管理员' : '普通成员' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="joinTime" label="加入时间" min-width="180" />
          <el-table-column label="操作" width="220" fixed="right" v-if="isAdmin">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                @click="showUpdateRoleDialog(row)"
                v-if="currentUserId !== row.userId"
              >
                修改角色
              </el-button>
              <el-popconfirm
                title="确定要移除该成员吗？"
                @confirm="removeMember(row)"
                v-if="currentUserId !== row.userId"
              >
                <template #reference>
                  <el-button type="danger" size="small">移除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
        
        <el-pagination
          v-if="members.length > 10"
          layout="prev, pager, next"
          :total="members.length"
          :page-size="10"
          class="pagination"
        />
      </div>
    </el-card>

    <!-- 添加成员对话框 -->
    <el-dialog
      v-model="addMemberDialogVisible"
      title="添加团队成员"
      width="450px"
    >
      <el-form
        ref="memberFormRef"
        :model="memberForm"
        :rules="memberRules"
        label-width="100px"
      >
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="memberForm.userId" placeholder="请输入用户ID"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addMemberDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAddMember" :loading="submitting">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改角色对话框 -->
    <el-dialog
      v-model="updateRoleDialogVisible"
      title="修改成员角色"
      width="450px"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleRules"
        label-width="100px"
      >
        <el-form-item label="用户ID">
          <el-input v-model="roleForm.userId" disabled></el-input>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="roleForm.userName" disabled></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="roleForm.roleId" placeholder="请选择角色">
            <el-option label="普通成员" :value="1" />
            <el-option label="管理员" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="updateRoleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpdateRole" :loading="submitting">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { getTeamMembers, addTeamMember, deleteTeamMember, updateTeamRole } from '@/api/team'

const props = defineProps({
  teamId: {
    type: Number,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh'])

// 状态
const loading = ref(false)
const submitting = ref(false)
const addMemberDialogVisible = ref(false)
const updateRoleDialogVisible = ref(false)
const members = ref<any[]>([])
const currentUserId = ref(parseInt(localStorage.getItem('uid') || '0'))

// 表单引用
const memberFormRef = ref<FormInstance>()
const roleFormRef = ref<FormInstance>()

// 添加成员表单
const memberForm = reactive({
  userId: ''
})

// 修改角色表单
const roleForm = reactive({
  userId: '',
  userName: '',
  roleId: 1
})

// 表单校验规则
const memberRules = reactive<FormRules>({
  userId: [
    { required: true, message: '请输入用户ID', trigger: 'blur' }
  ]
})

const roleRules = reactive<FormRules>({
  roleId: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
})

// 获取团队成员
const fetchMembers = async () => {
  loading.value = true
  try {
    const res = await getTeamMembers(props.teamId)
    if (res.data && res.data.code === 200) {
      members.value = res.data.data || []
    } else {
      ElMessage.error(res.data?.msg || '获取团队成员失败')
    }
  } catch (error) {
    console.error('获取团队成员出错:', error)
    ElMessage.error('网络错误，获取团队成员失败')
  } finally {
    loading.value = false
  }
}

// 显示添加成员对话框
const showAddMemberDialog = () => {
  memberForm.userId = ''
  addMemberDialogVisible.value = true
}

// 显示更新角色对话框
const showUpdateRoleDialog = (member: any) => {
  roleForm.userId = member.userId
  roleForm.userName = member.userName
  roleForm.roleId = member.roleId
  updateRoleDialogVisible.value = true
}

// 提交添加成员
const submitAddMember = async () => {
  if (!memberFormRef.value) return
  
  await memberFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const res = await addTeamMember({
        teamId: props.teamId,
        userId: parseInt(memberForm.userId)
      })
      
      if (res.data && res.data.code === 200) {
        ElMessage.success('添加成员成功')
        addMemberDialogVisible.value = false
        fetchMembers() // 刷新成员列表
      } else {
        ElMessage.error(res.data?.msg || '添加成员失败')
      }
    } catch (error) {
      console.error('添加成员出错:', error)
      ElMessage.error('网络错误，添加成员失败')
    } finally {
      submitting.value = false
    }
  })
}

// 提交更新角色
const submitUpdateRole = async () => {
  if (!roleFormRef.value) return
  
  await roleFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const res = await updateTeamRole({
        teamId: props.teamId,
        userId: parseInt(roleForm.userId),
        roleId: roleForm.roleId
      })
      
      if (res.data && res.data.code === 200) {
        ElMessage.success('更新角色成功')
        updateRoleDialogVisible.value = false
        fetchMembers() // 刷新成员列表
      } else {
        ElMessage.error(res.data?.msg || '更新角色失败')
      }
    } catch (error) {
      console.error('更新角色出错:', error)
      ElMessage.error('网络错误，更新角色失败')
    } finally {
      submitting.value = false
    }
  })
}

// 移除成员
const removeMember = async (member: any) => {
  try {
    const res = await deleteTeamMember({
      teamId: props.teamId,
      userId: member.userId
    })
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('移除成员成功')
      fetchMembers() // 刷新成员列表
    } else {
      ElMessage.error(res.data?.msg || '移除成员失败')
    }
  } catch (error) {
    console.error('移除成员出错:', error)
    ElMessage.error('网络错误，移除成员失败')
  }
}

// 组件挂载时获取成员列表
onMounted(() => {
  if (props.teamId) {
    fetchMembers()
  }
})

// 监听团队ID变化，重新获取成员列表
watch(() => props.teamId, (newValue) => {
  if (newValue) {
    fetchMembers()
  }
}, { immediate: true })
</script>

<style scoped>
.team-members-container {
  padding: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}
</style> 