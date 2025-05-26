<template>
  <div class="team-knowledge-container">
    <el-button type="primary" @click="goToKnowledgePage">
      <el-icon><DocumentCopy /></el-icon>
      进入团队知识库
    </el-button>
    
    <div class="knowledge-preview" v-if="recentKnowledge.length > 0">
      <h3>最近知识</h3>
      <el-table :data="recentKnowledge" style="width: 100%" max-height="400">
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.type === 1">文件</el-tag>
            <el-tag v-else-if="row.type === 2" type="success">MD文件</el-tag>
            <el-tag v-else-if="row.type === 3" type="warning">图像</el-tag>
            <el-tag v-else-if="row.type === 4" type="danger">视频</el-tag>
            <el-tag v-else type="info">其他</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewKnowledge(row)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <el-empty v-else description="暂无团队知识" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  teamId: {
    type: Number,
    required: true
  }
})

const router = useRouter()
const recentKnowledge = ref<any[]>([])

// 获取最近的知识项目
const fetchRecentKnowledge = async () => {
  try {
    // 这里应该调用API来获取团队最近的知识，示例使用模拟数据
    // 实际应该替换为真实API调用
    // 例如: const res = await getTeamRecentKnowledge(props.teamId)
    
    // 模拟数据
    setTimeout(() => {
      recentKnowledge.value = [
        {
          id: 1,
          name: '团队协作规范',
          type: 2,
          createTime: '2023-10-25 14:30:00'
        },
        {
          id: 2,
          name: '项目进度记录',
          type: 1,
          createTime: '2023-10-24 09:15:00'
        }
      ]
    }, 500)
  } catch (error) {
    console.error('获取团队最近知识失败:', error)
    ElMessage.error('获取团队最近知识失败')
  }
}

// 跳转到知识库页面
const goToKnowledgePage = () => {
  router.push({
    path: '/knowledge',
    query: { teamId: props.teamId.toString() }
  })
}

// 查看知识详情
const viewKnowledge = (knowledge: any) => {
  router.push({
    path: '/knowledge',
    query: { 
      teamId: props.teamId.toString(),
      knowledgeId: knowledge.id.toString()
    }
  })
}

onMounted(() => {
  fetchRecentKnowledge()
})
</script>

<style scoped>
.team-knowledge-container {
  padding: 10px;
}

.knowledge-preview {
  margin-top: 20px;
}

@media (max-height: 800px) {
  .team-knowledge-container {
    padding: 5px;
  }
  
  .knowledge-preview {
    margin-top: 10px;
  }
  
  .el-table {
    font-size: 13px;
  }
}
</style> 