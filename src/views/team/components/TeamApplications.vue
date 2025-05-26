<template>
  <div class="team-applications-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>加入申请管理</span>
          <el-button type="primary" size="small" @click="fetchApplications">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </template>

      <div v-loading="loading">
        <el-empty v-if="applications.length === 0" description="暂无申请记录"></el-empty>
        
        <el-table v-else :data="applications" style="width: 100%" border>
          <el-table-column prop="id" label="申请ID" width="80" />
          <el-table-column prop="userId" label="用户ID" width="80" />
          <el-table-column prop="type" label="申请类型" width="120">
            <template #default="{ row }">
              <el-tag :type="row.type === 1 ? 'warning' : 'info'">
                {{ row.type === 1 ? '管理员邀请' : '用户申请' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="applyMessage" label="申请信息" min-width="180" />
          <el-table-column prop="createTime" label="申请时间" min-width="180" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <div v-if="row.status === 1">
                <el-button 
                  type="success" 
                  size="small" 
                  @click="showApproveDialog(row)"
                >
                  通过
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="showRejectDialog(row)"
                >
                  拒绝
                </el-button>
              </div>
              <span v-else-if="row.status === 3">
                已通过: {{ row.passMessage || '无备注' }}
              </span>
              <span v-else-if="row.status === 2">
                已拒绝
              </span>
              <span v-else-if="row.status === 0">
                已取消
              </span>
            </template>
          </el-table-column>
        </el-table>
        
        <el-pagination
          v-if="applications.length > 10"
          layout="prev, pager, next"
          :total="applications.length"
          :page-size="10"
          class="pagination"
        />
      </div>
    </el-card>

    <!-- 通过申请对话框 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="通过申请"
      width="450px"
    >
      <el-form
        ref="approveFormRef"
        :model="approveForm"
        label-width="100px"
      >
        <el-form-item label="申请ID">
          <el-input v-model="approveForm.id" disabled></el-input>
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="approveForm.userId" disabled></el-input>
        </el-form-item>
        <el-form-item label="审批备注">
          <el-input 
            v-model="approveForm.passMessage" 
            type="textarea" 
            :rows="3" 
            placeholder="可选填写审批备注"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="approveDialogVisible = false">取消</el-button>
          <el-button type="success" @click="approveApplication" :loading="submitting">
            确认通过
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 拒绝申请对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝申请"
      width="450px"
    >
      <el-form
        ref="rejectFormRef"
        :model="rejectForm"
        label-width="100px"
      >
        <el-form-item label="申请ID">
          <el-input v-model="rejectForm.id" disabled></el-input>
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="rejectForm.userId" disabled></el-input>
        </el-form-item>
        <el-form-item label="拒绝原因">
          <el-input 
            v-model="rejectForm.rejectMessage" 
            type="textarea" 
            :rows="3" 
            placeholder="可选填写拒绝原因"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="rejectApplication" :loading="submitting">
            确认拒绝
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import { getTeamApplyList, passJoinTeam, rejectJoinTeam } from '@/api/team'

const props = defineProps({
  teamId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['refresh'])

// 状态
const loading = ref(false)
const submitting = ref(false)
const approveDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const applications = ref<any[]>([])

// 表单引用
const approveFormRef = ref<FormInstance>()
const rejectFormRef = ref<FormInstance>()

// 通过申请表单
const approveForm = reactive({
  id: '',
  userId: '',
  passMessage: ''
})

// 拒绝申请表单
const rejectForm = reactive({
  id: '',
  userId: '',
  rejectMessage: ''
})

// 获取申请列表
const fetchApplications = async () => {
  loading.value = true
  try {
    const res = await getTeamApplyList(props.teamId)
    if (res.data && res.data.code === 200) {
      applications.value = res.data.data || []
    } else {
      ElMessage.error(res.data?.msg || '获取申请列表失败')
    }
  } catch (error) {
    console.error('获取申请列表出错:', error)
    ElMessage.error('网络错误，获取申请列表失败')
  } finally {
    loading.value = false
  }
}

// 获取状态类型
const getStatusType = (status: number) => {
  switch (status) {
    case 0: return 'info'      // 取消申请
    case 1: return 'warning'   // 申请中
    case 2: return 'danger'    // 申请失败
    case 3: return 'success'   // 申请成功
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: number) => {
  switch (status) {
    case 0: return '已取消'
    case 1: return '申请中'
    case 2: return '已拒绝'
    case 3: return '已通过'
    default: return '未知'
  }
}

// 显示通过申请对话框
const showApproveDialog = (application: any) => {
  approveForm.id = application.id
  approveForm.userId = application.userId
  approveForm.passMessage = ''
  approveDialogVisible.value = true
}

// 显示拒绝申请对话框
const showRejectDialog = (application: any) => {
  rejectForm.id = application.id
  rejectForm.userId = application.userId
  rejectForm.rejectMessage = ''
  rejectDialogVisible.value = true
}

// 通过申请
const approveApplication = async () => {
  submitting.value = true
  try {
    const res = await passJoinTeam({
      id: approveForm.id,
      passMessage: approveForm.passMessage
    })
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('已通过申请')
      approveDialogVisible.value = false
      fetchApplications() // 刷新申请列表
      emit('refresh') // 通知父组件刷新
    } else {
      ElMessage.error(res.data?.msg || '通过申请失败')
    }
  } catch (error) {
    console.error('通过申请出错:', error)
    ElMessage.error('网络错误，通过申请失败')
  } finally {
    submitting.value = false
  }
}

// 拒绝申请
const rejectApplication = async () => {
  submitting.value = true
  try {
    const res = await rejectJoinTeam({
      id: rejectForm.id,
      rejectMessage: rejectForm.rejectMessage
    })
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('已拒绝申请')
      rejectDialogVisible.value = false
      fetchApplications() // 刷新申请列表
    } else {
      ElMessage.error(res.data?.msg || '拒绝申请失败')
    }
  } catch (error) {
    console.error('拒绝申请出错:', error)
    ElMessage.error('网络错误，拒绝申请失败')
  } finally {
    submitting.value = false
  }
}

// 组件挂载时获取申请列表
onMounted(() => {
  if (props.teamId) {
    fetchApplications()
  }
})

// 监听团队ID变化，重新获取申请列表
watch(() => props.teamId, (newValue) => {
  if (newValue) {
    fetchApplications()
  }
}, { immediate: true })
</script>

<style scoped>
.team-applications-container {
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