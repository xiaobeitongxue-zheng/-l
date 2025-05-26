<template>
  <div class="knowledge-container">
    <!-- 全局搜索框 -->
    <div class="search-container">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索知识..."
        class="search-input"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon class="search-icon"><Search /></el-icon>
        </template>
        <template #append>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <!-- 搜索结果展示 -->
    <div v-if="showSearchResults" class="search-results-container">
      <div class="page-header">
        <div class="page-title">
          <el-button class="back-button" @click="closeSearchResults" size="default">
            <el-icon><Back /></el-icon> 返回
          </el-button>
          <h2 class="result-page-title">搜索结果: <span class="keyword">{{ searchKeyword }}</span></h2>
        </div>
      </div>

      <el-card v-loading="searchLoading">
        <el-empty v-if="searchResults.length === 0" description="未找到匹配的知识"></el-empty>
        
        <div v-else class="search-results">
          <div 
            v-for="result in searchResults" 
            :key="result.id" 
            class="search-result-item"
            @click="showKnowledgeDetail(result)"
          >
            <div class="result-header">
              <el-icon><Document /></el-icon>
              <span class="result-title">{{ result.name }}</span>
              <el-tag size="small" v-if="result.status === 1" type="success">公开</el-tag>
              <el-tag size="small" v-else type="info">私有</el-tag>
            </div>
            <div class="result-content">
              <p class="result-summary">{{ result.summary || '暂无摘要' }}</p>
              <div class="result-meta">
                <span>知识集: {{ result.setName }}</span>
                <span>创建时间: {{ result.createTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 知识集页面 -->
    <div v-else-if="!activeSetId">
      <div class="page-header">
        <h2>知识集管理</h2>
        <el-button type="primary" @click="showCreateSetDialog">
          <el-icon><Plus /></el-icon> 新建知识集
        </el-button>
      </div>
      
      <el-card v-loading="loadingSets" class="knowledge-sets-card">
        <el-empty v-if="knowledgeSets.length === 0" description="暂无知识集"></el-empty>
        <div v-else class="knowledge-sets-grid">
          <el-card 
            v-for="set in knowledgeSets" 
            :key="set.id" 
            class="knowledge-set-item"
            shadow="hover"
            @click="handleSetSelect(set.id.toString())"
          >
            <div class="set-item-content">
              <div class="set-info">
                <el-icon class="set-icon"><Folder /></el-icon>
                <span class="set-name">{{ set.name }}</span>
              </div>
              <div class="set-actions">
                <el-button 
                  link 
                  type="primary" 
                  size="small"
                  @click.stop="showEditSetDialog(set)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button 
                  link 
                  type="danger" 
                  size="small"
                  @click.stop="confirmDeleteSet(set)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </el-card>
    </div>
    
    <!-- 知识列表页面 -->
    <div v-else>
      <div class="page-header">
        <div class="page-title">
          <el-button @click="backToKnowledgeSets" size="small">
            <el-icon><Back /></el-icon> 返回
          </el-button>
          <h2>{{ activeSetName }}</h2>
        </div>
        <el-button type="primary" @click="showCreateKnowledgeDialog">
          <el-icon><Plus /></el-icon> 新建知识
        </el-button>
      </div>
      
      <el-card v-loading="loadingKnowledge">
        <el-empty v-if="knowledgeList.length === 0" description="暂无知识"></el-empty>
        
        <el-table v-else :data="knowledgeList" style="width: 100%">
          <el-table-column prop="name" label="知识名称" min-width="200">
            <template #default="{ row }">
              <div class="knowledge-name" @click="showKnowledgeDetail(row)">
                <el-icon><Document /></el-icon>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.type === 1">文件</el-tag>
              <el-tag v-else-if="row.type === 2" type="success">MD文件</el-tag>
              <el-tag v-else-if="row.type === 3" type="warning">图像</el-tag>
              <el-tag v-else-if="row.type === 4" type="danger">视频</el-tag>
              <el-tag v-else type="info">其他</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.status === 1" type="success">公开</el-tag>
              <el-tag v-else type="info">私有</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
          
          <el-table-column prop="updateTime" label="更新时间" width="180"></el-table-column>
          
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <div class="knowledge-actions">
                <el-button 
                  link 
                  type="primary" 
                  size="small" 
                  @click="showEditKnowledgeDialog(row)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button 
                  link 
                  type="danger" 
                  size="small" 
                  @click="confirmDeleteKnowledge(row)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
                <el-button 
                  v-if="row.status === 0"
                  link 
                  type="success" 
                  size="small" 
                  @click="handlePublishKnowledge(row)"
                >
                  发布
                </el-button>
                <el-button 
                  v-else
                  link 
                  type="warning" 
                  size="small" 
                  @click="handleCancelPublishKnowledge(row)"
                >
                  取消发布
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 知识集对话框 -->
    <el-dialog 
      v-model="setDialogVisible" 
      :title="isEditingSet ? '编辑知识集' : '新建知识集'" 
      width="500px"
    >
      <el-form 
        ref="setFormRef" 
        :model="setForm" 
        :rules="setFormRules" 
        label-width="100px"
      >
        <el-form-item label="知识集名称" prop="name">
          <el-input v-model="setForm.name" placeholder="请输入知识集名称"></el-input>
        </el-form-item>
        
        <el-form-item v-if="!isEditingSet" label="空间ID" prop="space">
          <el-input v-model.number="setForm.space" placeholder="请输入空间ID"></el-input>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="setDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitSetForm" :loading="submittingSet">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 知识对话框 -->
    <el-dialog 
      v-model="knowledgeDialogVisible" 
      :title="isEditingKnowledge ? '编辑知识' : '新建知识'" 
      width="500px"
    >
      <el-form 
        ref="knowledgeFormRef" 
        :model="knowledgeForm" 
        :rules="knowledgeFormRules" 
        label-width="100px"
      >
        <el-form-item label="知识名称" prop="name">
          <el-input v-model="knowledgeForm.name" placeholder="请输入知识名称"></el-input>
        </el-form-item>
        
        <el-form-item label="知识摘要" prop="summary">
          <el-input 
            v-model="knowledgeForm.summary" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入知识摘要"
          ></el-input>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="knowledgeForm.status">
            <el-radio :label="1">公开</el-radio>
            <el-radio :label="0">私有</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="知识文件" prop="file">
          <el-upload
            class="knowledge-file-upload"
            action="#"
            :http-request="uploadKnowledgeFile"
            :auto-upload="false"
            :limit="1"
            :file-list="knowledgeFileList"
            :on-change="handleFileChange"
            accept=".md"
          >
            <el-button type="primary">选择MD文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                请上传MD格式文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="knowledgeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitKnowledgeForm" :loading="submittingKnowledge">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 知识详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="知识详情" width="800px">
      <div v-loading="loadingDetail">
        <h2>{{ currentKnowledge.name }}</h2>
        <div class="knowledge-meta">
          <el-tag v-if="currentKnowledge.type === 1">文件</el-tag>
          <el-tag v-else-if="currentKnowledge.type === 2" type="success">MD文件</el-tag>
          <el-tag v-else-if="currentKnowledge.type === 3" type="warning">图像</el-tag>
          <el-tag v-else-if="currentKnowledge.type === 4" type="danger">视频</el-tag>
          <el-tag v-else type="info">其他</el-tag>
          <span class="knowledge-date">创建时间: {{ currentKnowledge.createTime }}</span>
          <span class="knowledge-date">更新时间: {{ currentKnowledge.updateTime }}</span>
        </div>
        <div class="knowledge-summary">
          <h3>摘要:</h3>
          <p>{{ currentKnowledge.summary || '暂无摘要' }}</p>
        </div>
        <div class="knowledge-content">
          <h3>内容:</h3>
          <div v-html="currentKnowledge.content || '暂无内容'"></div>
        </div>
        
        <div class="detail-actions">
          <el-button 
            v-if="currentKnowledge.status === 0" 
            type="success" 
            size="small"
            @click="handlePublishKnowledge(currentKnowledge)"
          >
            发布到社区
          </el-button>
          <el-button 
            v-else 
            type="warning" 
            size="small"
            @click="handleCancelPublishKnowledge(currentKnowledge)"
          >
            取消发布
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, UploadUserFile } from 'element-plus'
import { Plus, Edit, Delete, Folder, Document, Back, Search } from '@element-plus/icons-vue'
import {
  createKnowledgeSet,
  updateKnowledgeSet,
  getKnowledgeSets,
  deleteKnowledgeSet,
  createKnowledge,
  getKnowledgePreview,
  updateKnowledgePreview,
  getAllKnowledge,
  updateKnowledge,
  deleteKnowledge,
  publishKnowledge,
  cancelPublishKnowledge,
  searchKnowledge
} from '@/api/knowledge'

// 获取路由参数
const route = useRoute()
const teamIdFromRoute = computed(() => {
  const id = route.query.teamId
  return id ? parseInt(id.toString()) : null
})

// 默认的空间ID，如果路由中有teamId则使用，否则默认为1
const defaultSpaceId = computed(() => teamIdFromRoute.value || 1)

// 知识集相关状态
const knowledgeSets = ref<any[]>([])
const loadingSets = ref(false)
const activeSetId = ref<number | null>(null)
const activeSetName = ref('')

// 知识列表相关状态
const knowledgeList = ref<any[]>([])
const loadingKnowledge = ref(false)

// 知识集表单相关
const setDialogVisible = ref(false)
const isEditingSet = ref(false)
const submittingSet = ref(false)
const setFormRef = ref<FormInstance>()
const setForm = reactive({
  id: '',
  name: '',
  space: 1,
  ownerId: 0,
  ownerType: 1
})
const setFormRules = {
  name: [
    { required: true, message: '请输入知识集名称', trigger: 'blur' },
    { min: 1, max: 255, message: '长度在1到255个字符之间', trigger: 'blur' }
  ],
  space: [
    { required: true, message: '请输入空间ID', trigger: 'blur' },
    { type: 'number', message: '空间ID必须为数字', trigger: 'blur' }
  ]
}

// 知识表单相关
const knowledgeDialogVisible = ref(false)
const isEditingKnowledge = ref(false)
const submittingKnowledge = ref(false)
const knowledgeFormRef = ref<FormInstance>()
const knowledgeFileList = ref<UploadUserFile[]>([])
const knowledgeForm = reactive({
  id: 0,
  name: '',
  setId: 0,
  space: 1,
  summary: '',
  status: 1,
  file: null as File | null
})
const knowledgeFormRules = {
  name: [
    { required: true, message: '请输入知识名称', trigger: 'blur' },
    { min: 1, max: 255, message: '长度在1到255个字符之间', trigger: 'blur' }
  ],
  file: [
    { required: true, message: '请上传知识文件', trigger: 'change' }
  ]
}

// 知识详情相关
const detailDialogVisible = ref(false)
const loadingDetail = ref(false)
const currentKnowledge = ref<any>({})

// 搜索相关状态
const searchKeyword = ref('')
const searchResults = ref<any[]>([])
const searchLoading = ref(false)
const showSearchResults = ref(false)

// 生命周期钩子
onMounted(() => {
  fetchKnowledgeSets()
})

// 方法：获取知识集列表
const fetchKnowledgeSets = async () => {
  loadingSets.value = true
  try {
    const res = await getKnowledgeSets(defaultSpaceId.value)
    if (res.data && res.data.code === 200) {
      knowledgeSets.value = res.data.data || []
    } else {
      ElMessage.error(res.data?.msg || '获取知识集失败')
    }
  } catch (error) {
    console.error('获取知识集列表出错:', error)
    ElMessage.error('网络错误，获取知识集列表失败')
  } finally {
    loadingSets.value = false
  }
}

// 方法：选择知识集
const handleSetSelect = async (index: string) => {
  activeSetId.value = parseInt(index)
  const selectedSet = knowledgeSets.value.find(set => set.id === activeSetId.value)
  if (selectedSet) {
    activeSetName.value = selectedSet.name
    await fetchKnowledgeList(activeSetId.value)
  }
}

// 方法：获取知识列表
const fetchKnowledgeList = async (setId: number) => {
  if (!setId) return
  
  loadingKnowledge.value = true
  try {
    const res = await getAllKnowledge(setId, defaultSpaceId.value)
    if (res.data && res.data.code === 200) {
      knowledgeList.value = res.data.data || []
    } else {
      ElMessage.error(res.data?.msg || '获取知识列表失败')
    }
  } catch (error) {
    console.error('获取知识列表出错:', error)
    ElMessage.error('网络错误，获取知识列表失败')
  } finally {
    loadingKnowledge.value = false
  }
}

// 方法：显示创建知识集对话框
const showCreateSetDialog = () => {
  isEditingSet.value = false
  setForm.id = ''
  setForm.name = ''
  setForm.space = defaultSpaceId.value
  setDialogVisible.value = true
}

// 方法：显示编辑知识集对话框
const showEditSetDialog = (set: any) => {
  isEditingSet.value = true
  setForm.id = set.id
  setForm.name = set.name
  setForm.ownerId = set.ownerId || 0
  setForm.ownerType = set.ownerType || 1
  setDialogVisible.value = true
}

// 方法：确认删除知识集
const confirmDeleteSet = (set: any) => {
  ElMessageBox.confirm(
    `确定要删除知识集"${set.name}"吗？其中包含的所有知识也将被删除。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await deleteKnowledgeSet(set.id, defaultSpaceId.value)
      if (res.data && res.data.code === 200) {
        ElMessage.success('删除知识集成功')
        // 刷新知识集列表
        fetchKnowledgeSets()
        
        // 如果删除的是当前选中的知识集，则清空右侧内容
        if (activeSetId.value === set.id) {
          activeSetId.value = null
          activeSetName.value = ''
          knowledgeList.value = []
        }
      } else {
        ElMessage.error(res.data?.msg || '删除知识集失败')
      }
    } catch (error) {
      console.error('删除知识集出错:', error)
      ElMessage.error('网络错误，删除知识集失败')
    }
  }).catch(() => {
    // 取消删除操作
  })
}

// 方法：提交知识集表单
const submitSetForm = async () => {
  if (!setFormRef.value) return
  
  await setFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    // 检查空间ID是否重复
    if (!isEditingSet.value) {
      // 检查是否存在相同的空间ID
      const isDuplicate = knowledgeSets.value.some(set => 
        set.space === setForm.space
      )
      
      if (isDuplicate) {
        ElMessage.error('空间ID已存在，请使用不同的空间ID')
        return
      }
    }
    
    submittingSet.value = true
    try {
      let res
      if (isEditingSet.value) {
        // 更新知识集
        res = await updateKnowledgeSet({
          id: setForm.id,
          name: setForm.name,
          ownerId: setForm.ownerId,
          ownerType: setForm.ownerType
        })
      } else {
        // 创建知识集
        res = await createKnowledgeSet({
          name: setForm.name,
          space: setForm.space
        })
      }
      
      if (res.data && res.data.code === 200) {
        ElMessage.success(isEditingSet.value ? '更新知识集成功' : '创建知识集成功')
        setDialogVisible.value = false
        
        // 刷新知识集列表
        fetchKnowledgeSets()
      } else {
        // 检查是否是空间ID重复的错误
        if (res.data && res.data.msg && res.data.msg.includes('空间ID已存在')) {
          ElMessage.error('空间ID已存在，请使用不同的空间ID')
        } else {
          ElMessage.error(res.data?.msg || (isEditingSet.value ? '更新知识集失败' : '创建知识集失败'))
        }
      }
    } catch (error) {
      console.error(isEditingSet.value ? '更新知识集出错:' : '创建知识集出错:', error)
      ElMessage.error('网络错误，' + (isEditingSet.value ? '更新' : '创建') + '知识集失败')
    } finally {
      submittingSet.value = false
    }
  })
}

// 方法：显示创建知识对话框
const showCreateKnowledgeDialog = () => {
  if (!activeSetId.value) {
    ElMessage.warning('请先选择一个知识集')
    return
  }
  
  isEditingKnowledge.value = false
  knowledgeForm.id = 0
  knowledgeForm.name = ''
  knowledgeForm.setId = activeSetId.value
  knowledgeForm.space = defaultSpaceId.value
  knowledgeForm.summary = ''
  knowledgeForm.status = 1
  knowledgeForm.file = null
  knowledgeFileList.value = []
  knowledgeDialogVisible.value = true
}

// 方法：显示编辑知识对话框
const showEditKnowledgeDialog = (knowledge: any) => {
  isEditingKnowledge.value = true
  knowledgeForm.id = knowledge.id
  knowledgeForm.name = knowledge.name
  knowledgeForm.setId = activeSetId.value || 0
  knowledgeForm.space = defaultSpaceId.value
  knowledgeForm.summary = knowledge.summary || ''
  knowledgeForm.status = knowledge.status
  knowledgeForm.file = null
  knowledgeFileList.value = []
  knowledgeDialogVisible.value = true
}

// 方法：处理文件选择
const handleFileChange = (file: any) => {
  knowledgeForm.file = file.raw
}

// 方法：上传知识文件（仅为了和el-upload配合，实际上传在提交表单时进行）
const uploadKnowledgeFile = () => {
  // 空方法，不执行实际上传
}

// 方法：提交知识表单
const submitKnowledgeForm = async () => {
  if (!knowledgeFormRef.value) return
  
  await knowledgeFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    // 检查必要的参数
    if (!activeSetId.value) {
      ElMessage.warning('请先选择一个知识集')
      return
    }
    
    // 在编辑模式下，如果没有选择新文件，跳过文件验证
    if (isEditingKnowledge.value && !knowledgeForm.file) {
      // 在编辑模式下，可以只更新知识预览信息
      await updateKnowledgePreviewInfo()
      return
    }
    
    // 如果是创建模式或编辑模式下选择了新文件，则需要验证文件
    if (!knowledgeForm.file) {
      ElMessage.warning('请上传知识文件')
      return
    }
    
    submittingKnowledge.value = true
    try {
      const formData = new FormData()
      formData.append('name', knowledgeForm.name)
      formData.append('setId', activeSetId.value.toString())
      formData.append('space', defaultSpaceId.value.toString())
      
      if (knowledgeForm.file) {
        formData.append('file', knowledgeForm.file)
      }
      
      let res
      if (isEditingKnowledge.value) {
        // 更新知识内容（包含文件）
        res = await updateKnowledge(
          activeSetId.value,
          defaultSpaceId.value,
          knowledgeForm.id,
          formData
        )
      } else {
        // 创建新知识
        res = await createKnowledge(
          activeSetId.value,
          defaultSpaceId.value,
          formData
        )
      }
      
      if (res.data && res.data.code === 200) {
        ElMessage.success(isEditingKnowledge.value ? '更新知识成功' : '创建知识成功')
        knowledgeDialogVisible.value = false
        
        // 刷新知识列表
        fetchKnowledgeList(activeSetId.value)
      } else {
        ElMessage.error(res.data?.msg || (isEditingKnowledge.value ? '更新知识失败' : '创建知识失败'))
      }
    } catch (error) {
      console.error(isEditingKnowledge.value ? '更新知识出错:' : '创建知识出错:', error)
      ElMessage.error('网络错误，' + (isEditingKnowledge.value ? '更新' : '创建') + '知识失败')
    } finally {
      submittingKnowledge.value = false
    }
  })
}

// 方法：只更新知识预览信息（不包含文件）
const updateKnowledgePreviewInfo = async () => {
  if (!activeSetId.value || !knowledgeForm.id) return
  
  submittingKnowledge.value = true
  try {
    const res = await updateKnowledgePreview(
      activeSetId.value,
      defaultSpaceId.value,
      knowledgeForm.id,
      {
        name: knowledgeForm.name,
        status: knowledgeForm.status,
        summary: knowledgeForm.summary
      }
    )
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('更新知识信息成功')
      knowledgeDialogVisible.value = false
      
      // 刷新知识列表
      fetchKnowledgeList(activeSetId.value)
    } else {
      ElMessage.error(res.data?.msg || '更新知识信息失败')
    }
  } catch (error) {
    console.error('更新知识信息出错:', error)
    ElMessage.error('网络错误，更新知识信息失败')
  } finally {
    submittingKnowledge.value = false
  }
}

// 方法：确认删除知识
const confirmDeleteKnowledge = (knowledge: any) => {
  ElMessageBox.confirm(
    `确定要删除知识"${knowledge.name}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    if (!activeSetId.value) return
    
    try {
      const res = await deleteKnowledge(
        activeSetId.value,
        defaultSpaceId.value,
        knowledge.id
      )
      
      if (res.data && res.data.code === 200) {
        ElMessage.success('删除知识成功')
        
        // 刷新知识列表
        fetchKnowledgeList(activeSetId.value)
      } else {
        ElMessage.error(res.data?.msg || '删除知识失败')
      }
    } catch (error) {
      console.error('删除知识出错:', error)
      ElMessage.error('网络错误，删除知识失败')
    }
  }).catch(() => {
    // 取消删除操作
  })
}

// 方法：显示知识详情
const showKnowledgeDetail = async (knowledge: any) => {
  if (!knowledge) return

  // 如果是从搜索结果中点击，需要先获取知识所属的知识集ID
  const setId = knowledge.setId || activeSetId.value
  if (!setId) {
    ElMessage.warning('无法确定知识所属的知识集')
    return
  }
  
  currentKnowledge.value = knowledge
  detailDialogVisible.value = true
  
  loadingDetail.value = true
  try {
    const res = await getKnowledgePreview(
      setId as number,
      defaultSpaceId.value,
      knowledge.id
    )
    
    if (res.data && res.data.code === 200) {
      // 更新当前知识的详细信息
      currentKnowledge.value = {
        ...currentKnowledge.value,
        ...res.data.data
      }
    } else {
      ElMessage.error(res.data?.msg || '获取知识详情失败')
    }
  } catch (error) {
    console.error('获取知识详情出错:', error)
    ElMessage.error('网络错误，获取知识详情失败')
  } finally {
    loadingDetail.value = false
  }
}

// 方法：发布知识到社区
const handlePublishKnowledge = async (knowledge: any) => {
  if (!knowledge) return
  
  // 如果是从搜索结果中点击，需要先获取知识所属的知识集ID
  const setId = knowledge.setId || activeSetId.value
  if (!setId) {
    ElMessage.warning('无法确定知识所属的知识集')
    return
  }
  
  try {
    const res = await publishKnowledge(
      defaultSpaceId.value,
      setId as number,
      knowledge.id
    )
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('发布知识到社区成功')
      
      // 更新知识状态为已发布
      knowledge.status = 1
      
      // 如果是详情页中的知识，更新详情页中的状态
      if (currentKnowledge.value && currentKnowledge.value.id === knowledge.id) {
        currentKnowledge.value.status = 1
      }
      
      // 如果在知识集列表中，刷新列表
      if (activeSetId.value && activeSetId.value === setId) {
        fetchKnowledgeList(activeSetId.value)
      }
      
      // 如果在搜索结果中，可以选择性刷新搜索结果
      if (showSearchResults.value) {
        // 这里不需要刷新整个搜索结果，因为我们已经更新了状态
      }
    } else {
      ElMessage.error(res.data?.msg || '发布知识到社区失败')
    }
  } catch (error) {
    console.error('发布知识到社区出错:', error)
    ElMessage.error('网络错误，发布知识到社区失败')
  }
}

// 方法：取消发布知识到社区
const handleCancelPublishKnowledge = async (knowledge: any) => {
  if (!knowledge) return
  
  // 如果是从搜索结果中点击，需要先获取知识所属的知识集ID
  const setId = knowledge.setId || activeSetId.value
  if (!setId) {
    ElMessage.warning('无法确定知识所属的知识集')
    return
  }
  
  try {
    const res = await cancelPublishKnowledge(
      defaultSpaceId.value,
      setId as number,
      knowledge.id
    )
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('取消发布知识成功')
      
      // 更新知识状态为未发布
      knowledge.status = 0
      
      // 如果是详情页中的知识，更新详情页中的状态
      if (currentKnowledge.value && currentKnowledge.value.id === knowledge.id) {
        currentKnowledge.value.status = 0
      }
      
      // 如果在知识集列表中，刷新列表
      if (activeSetId.value && activeSetId.value === setId) {
        fetchKnowledgeList(activeSetId.value)
      }
      
      // 如果在搜索结果中，可以选择性刷新搜索结果
      if (showSearchResults.value) {
        // 这里不需要刷新整个搜索结果，因为我们已经更新了状态
      }
    } else {
      ElMessage.error(res.data?.msg || '取消发布知识失败')
    }
  } catch (error) {
    console.error('取消发布知识出错:', error)
    ElMessage.error('网络错误，取消发布知识失败')
  }
}

// 方法：返回知识集列表
const backToKnowledgeSets = () => {
  activeSetId.value = null
  activeSetName.value = ''
  knowledgeList.value = []
}

// 方法：执行搜索
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  searchLoading.value = true
  showSearchResults.value = true
  try {
    const res = await searchKnowledge(searchKeyword.value, defaultSpaceId.value)
    if (res.data && res.data.code === 200) {
      searchResults.value = res.data.data || []
    } else {
      ElMessage.error(res.data?.msg || '搜索失败')
      searchResults.value = []
    }
  } catch (error) {
    console.error('搜索知识出错:', error)
    ElMessage.error('网络错误，搜索失败')
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

// 方法：关闭搜索结果
const closeSearchResults = () => {
  showSearchResults.value = false
  searchResults.value = []
}
</script>

<style scoped>
.knowledge-container {
  padding: 15px;
  height: 100%;
  overflow: auto;
}

.search-container {
  margin-bottom: 20px;
  position: relative;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  transition: all 0.3s;
}

.search-container:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 2px 8px;
  height: 42px;
  box-shadow: none;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.search-input :deep(.el-input__wrapper:hover) {
  border-color: #c0c4cc;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #409EFF;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2);
}

.search-input :deep(.el-input-group__append) {
  background-color: #409EFF;
  border-color: #409EFF;
  color: white;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  padding: 0 16px;
}

.search-icon {
  color: #909399;
  font-size: 14px;
  margin-right: 5px;
}

.search-results-container {
  margin-bottom: 20px;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.search-result-item {
  padding: 18px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
}

.search-result-item:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  border-color: #c6e2ff;
  transform: translateY(-2px);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.result-header .el-icon {
  color: #409EFF;
  font-size: 18px;
}

.result-title {
  font-size: 16px;
  font-weight: 500;
  color: #409EFF;
  flex-grow: 1;
}

.result-content {
  padding-left: 28px;
}

.result-summary {
  color: #606266;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  line-height: 1.5;
}

.result-meta {
  display: flex;
  justify-content: space-between;
  color: #909399;
  font-size: 12px;
  border-top: 1px dashed #ebeef5;
  padding-top: 12px;
  margin-top: 12px;
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
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s;
}

.back-button:hover {
  background-color: #f2f6fc;
}

.result-page-title {
  position: relative;
  padding-bottom: 8px;
}

.result-page-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background-color: #409EFF;
  border-radius: 3px;
}

.keyword {
  color: #409EFF;
  font-weight: 700;
}

.knowledge-sets-card {
  margin-bottom: 20px;
}

.knowledge-sets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 10px;
}

.knowledge-set-item {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.knowledge-set-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.set-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.set-icon {
  font-size: 24px;
  color: #409EFF;
}

.set-name {
  font-size: 16px;
  font-weight: 500;
}

.set-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.set-actions {
  display: flex;
  gap: 5px;
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s, opacity 0.2s;
}

.knowledge-set-item:hover .set-actions {
  visibility: visible;
  opacity: 1;
}

.knowledge-name {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: #409EFF;
}

.knowledge-meta {
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.knowledge-date {
  color: #909399;
  font-size: 14px;
}

.knowledge-summary {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.knowledge-content {
  margin-top: 20px;
  max-height: 50vh;
  overflow-y: auto;
}

.knowledge-file-upload {
  width: 100%;
}

.knowledge-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.detail-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
}

@media (max-height: 800px) {
  .knowledge-container {
    padding: 10px;
  }
  
  .el-table {
    font-size: 13px;
  }
  
  .el-dialog {
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .knowledge-sets-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .knowledge-sets-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style> 