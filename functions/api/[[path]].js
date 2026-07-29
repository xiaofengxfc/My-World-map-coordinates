/**
 * Pages Functions 代理 — 将 /api/* 请求转发到 Worker
 *
 * 需要在 Pages 环境变量中设置 API_WORKER_URL：
 * Settings → Environment variables → 添加
 *   变量名: API_WORKER_URL
 *   值:     https://你的worker名.xxx.workers.dev
 */

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)

  const workerUrl = env.API_WORKER_URL
  if (!workerUrl) {
    return new Response('API_WORKER_URL 未配置', { status: 500 })
  }

  const target = new URL(url.pathname + url.search, workerUrl)

  return fetch(target.toString(), {
    method: request.method,
    headers: request.headers,
    body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
  })
}
