# 企业知识库系统 - Nginx 网关配置说明

## 网关配置概述

本配置实现了一个Nginx网关，将不同的API请求转发到对应的后端服务，同时处理前端静态资源。网关在80端口监听，为企业知识库系统提供统一的访问入口。

## 后端服务映射

网关将请求转发到以下服务：

| 前端路径 | 代理到后端服务 | 后端端口 | 说明 |
|---------|---------------|---------|------|
| /api/user/ | 用户服务 | 8081 | 用户认证、登录、注册等 |
| /api/knowledge/ | 知识库服务 | 8082 | 知识内容管理、搜索等 |
| /api/team/ | 团队服务 | 8083 | 团队管理、协作等 |
| /api/file/ | 文件服务 | 8090 | 文件上传、下载等（无需token验证） |
| /api/captcha | 验证码服务 | 8081 | 生成验证码图片 |
| /api/doc/* | 各模块API文档 | 各自端口 | Swagger API文档 |

## 接口文档地址

系统各模块的接口文档可通过以下地址访问：

- 用户接口文档: [http://43.138.100.3:8081/doc.html](http://43.138.100.3:8081/doc.html)
- 知识库接口文档: [http://43.138.100.3:8082/doc.html](http://43.138.100.3:8082/doc.html)
- 团队接口文档: [http://43.138.100.3:8083/doc.html](http://43.138.100.3:8083/doc.html)
- 文件服务接口文档: [http://43.138.100.3:8090/doc.html](http://43.138.100.3:8090/doc.html)

通过网关的访问地址：

- 用户接口文档: http://localhost/api/doc/user
- 知识库接口文档: http://localhost/api/doc/knowledge
- 团队接口文档: http://localhost/api/doc/team
- 文件服务接口文档: http://localhost/api/doc/file

## 特殊处理

1. **前端路由处理**：所有前端路由请求都重定向到index.html，支持Vue Router的历史模式
2. **CORS支持**：添加了跨域资源共享(CORS)的响应头，允许前端页面发起跨域请求
3. **OPTIONS请求**：预检请求(OPTIONS)直接返回成功，支持CORS
4. **静态资源缓存**：为静态资源设置了1天的缓存时间
5. **验证码处理**：验证码接口禁止缓存，确保每次请求都获取新验证码
6. **文件上传配置**：对文件服务增加了超时时间和上传大小限制(50MB)
7. **安全头**：添加了安全相关的HTTP头，防止XSS、CSRF等攻击
8. **文件服务token放行**：文件服务的所有接口都不需要token验证

## 安装与使用

1. 将`nginx.conf`文件放置在Nginx配置目录（通常为`/etc/nginx/nginx.conf`）
2. 确保前端构建的静态文件放置在`/usr/share/nginx/html`目录下
3. 检查配置文件语法是否正确：`nginx -t`
4. 重新加载Nginx配置：`nginx -s reload`

## 接口调用示例

### 用户登录（无需Token）

```javascript
axios.post('http://localhost/api/user/login', {
  username: 'admin',
  password: '123456',
  captcha: 'abcd'
})
```

### 获取知识列表（需要Token）

```javascript
axios.get('http://localhost/api/knowledge/list', {
  headers: {
    'Authorization': 'Bearer your_token_here'
  }
})
```

### 团队接口调用（需要Token）

```javascript
axios.get('http://localhost/api/team/teams', {
  headers: {
    'Authorization': 'Bearer your_token_here'
  }
})
```

### 文件上传（无需Token）

```javascript
const formData = new FormData();
formData.append('file', fileObject);
axios.post('http://localhost/api/file/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})
```

## 配置调整说明

如果需要将网关部署到其他环境，请注意调整以下配置：

1. `server_name`：修改为你的域名
2. `proxy_pass`：修改为实际的后端服务地址
3. `client_max_body_size`：根据需要调整文件上传大小限制
4. `Access-Control-Allow-Origin`：根据安全需求调整允许的源

## 注意事项

- 此配置适用于开发和测试环境，生产环境需要进一步加强安全性
- 建议在生产环境开启HTTPS，添加SSL证书配置
- 实际部署时需根据服务器性能调整worker_processes和worker_connections参数
- 文件服务（8090端口）的所有接口均无需token验证，注意避免批量上传
