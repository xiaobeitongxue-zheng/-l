import request from '@/utils/request81.ts'

export function fileUpload(data: any) {
    return request({
        url: '/api/file/downloadFile',
        method: 'post',
        data,
        headers: {
            noToken: true // 文件操作不需要token
        }
    })
}

export function fileDownload(fileId: string) {
    return request({
        url: '/api/file/downloadFile',
        method: 'get',
        params: { fileId },
        headers: {
            noToken: true // 文件操作不需要token
        }
    })
}

export function imageUpload(data: any) {
    return request({
        url: '/api/file/imageUpload',
        method: 'post',
        data,
        headers: {
            noToken: true, // 文件操作不需要token
            'Content-Type': 'multipart/form-data'
        }
    })
}