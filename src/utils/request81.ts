import axios from 'axios'
import { getToken, isTokenExpired } from './auth';
import { ElMessage } from 'element-plus';
import router from '@/router';

const service = axios.create({
    // baseURL: "http://43.138.100.3:8080/",
    baseURL: '/api',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
})

// 不需要token的白名单路径
const whiteList = [
    '/user/users/login',
    '/user/users/register',
    '/api/file/downloadFile',
    '/api/file/downloadLargeFile',
    '/api/file/imageUpload',
    '/api/file/uploadFile'
];

service.interceptors.request.use(
    config => {
        // 判断请求路径是否在白名单中
        const url = config.url || '';
        const isWhiteListUrl = whiteList.some(path => url.includes(path));
        
        // 检查是否有noToken头部
        const noToken = config.headers?.noToken;
        
        console.log('请求URL:', url, '是否白名单:', isWhiteListUrl, '是否无需Token:', noToken);
        
        // 如果不在白名单中且没有noToken标记，则需要添加token
        if (!isWhiteListUrl && !noToken) {
            const token = getToken();
            console.log('当前Token:', token);
            
            // 检查是否有token以及token是否过期
            if (!token) {
                console.error('未检测到Token，重定向到登录页');
                ElMessage.error('未登录，请重新登录');
                router.push('/login');
                return Promise.reject(new Error('未登录'));
            }
            
            // 检查token是否过期
            if (isTokenExpired()) {
                console.error('Token已过期，重定向到登录页');
                ElMessage.error('登录已过期，请重新登录');
                router.push('/login');
                return Promise.reject(new Error('登录已过期'));
            }
            
            // 添加token到请求头
            config.headers['token'] = token;
            console.log('已添加Token到请求头');
        }
        
        // 删除noToken标记，避免发送到服务器
        if (config.headers?.noToken) {
            delete config.headers.noToken;
        }
        
        return config;
    },
    error => {
        console.log(error);
        return Promise.reject(error);
    }
)


service.interceptors.response.use(
    response => {
        // 只返回正常的响应
        return response;
    },
    error => {
        console.log('axios错误响应:', error) // 详细记录错误
        // 这里不应该返回错误对象，而应该返回一个拒绝的Promise
        ElMessage.error(error.message || '请求失败')
        return Promise.reject(error);
    }
)

export default service
