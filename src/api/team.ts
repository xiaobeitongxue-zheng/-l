import request from '@/utils/request81.ts'

// 团队创建接口参数类型
interface CreateTeamParams {
  teamName: string;
  description: string;
  status: number;
  ownerId?: number;
}

// 获取团队列表
export function getTeamList() {
  console.log('调用获取团队列表API')
  return request({
    url: '/user/teams/getTeamList',
    method: 'get'
  })
}

// 创建团队
export function createTeam(data: CreateTeamParams) {
  // 移除可能的ownerId,因为后端API实际不需要这个参数
  const { teamName, description, status } = data;
  const submitData = { teamName, description, status };
  
  console.log('创建团队API请求体:', JSON.stringify(submitData));
  return request({
    url: '/user/teams/createTeam',
    method: 'post',
    data: submitData,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('创建团队API响应完整数据:', response);
    // 检查响应中是否包含"当前团队已有成员"错误
    if (response?.data?.msg && response.data.msg.includes('当前团队已有成员')) {
      console.error('创建团队出现已有成员错误:', response.data);
    }
    return response;
  }).catch(error => {
    console.error('创建团队API错误:', error);
    throw error;
  });
}

// 更新团队信息
export function updateTeam(data: any) {
  return request({
    url: '/user/teams/updateTeam',
    method: 'post',
    data
  })
}

// 获取团队成员列表
export function getTeamMembers(teamId: number) {
  return request({
    url: '/user/teams/listMember',
    method: 'get',
    params: { teamId }
  })
}

// 添加团队成员
export function addTeamMember(data: any) {
  return request({
    url: '/user/teams/addMember',
    method: 'post',
    data
  })
}

// 删除团队成员
export function deleteTeamMember(data: any) {
  return request({
    url: '/user/teams/deleteMember',
    method: 'post',
    data
  })
}

// 更新团队成员角色
export function updateTeamRole(data: any) {
  return request({
    url: '/user/teams/updateTeamRole',
    method: 'post',
    data
  })
}

// 获取团队申请列表
export function getTeamApplyList(teamId: number) {
  return request({
    url: '/user/teams/applyList',
    method: 'post',
    data: { teamId }
  })
}

// 批准加入团队申请
export function passJoinTeam(data: any) {
  return request({
    url: '/user/teams/passJoinTeam',
    method: 'post',
    data
  })
}

// 拒绝加入团队申请
export function rejectJoinTeam(data: any) {
  return request({
    url: '/user/teams/rejectJoinTeam',
    method: 'post',
    data
  })
}

// 申请加入团队
export function applyForJoinTeam(data: any) {
  return request({
    url: '/user/teams/applyForJoinTeam',
    method: 'post',
    data
  })
}

// 退出团队
export function exitTeam() {
  return request({
    url: '/user/teams/exitTeam',
    method: 'post'
  })
}

// 解散团队
export function deleteTeam(teamId: number) {
  return request({
    url: '/user/teams/deleteTeam',
    method: 'post',
    data: { teamId }
  })
}
