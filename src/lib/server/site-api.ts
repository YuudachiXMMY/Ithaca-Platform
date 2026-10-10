import { env } from '$env/dynamic/private';

// 课程排课系统(Course-Scheduling-System)的官网数据端点客户端。
//
// 背景:询盘、订阅者、弹窗这三类数据的所有权已迁到课程排课系统 —— 那边有统一的运营控制台
// (/dashboard/site,超级管理员登录)。本站不再直接读写这些表,改为服务端调用它的 /api/site/*。
//
// 鉴权是共享密钥(X-Site-Secret),不是用户会话:调用方是本站的**服务端**,没有也不该有一个
// 能登控制台的长期用户账号。
//
// 两条失败语义,刻意不同:
//   · contact / subscribe → 调用方必须**硬失败**。悄悄丢掉一条询盘比报错糟得多。
//   · popups/active       → 调用方必须**软降级**(见 popup-cache.ts)。它在每个公开页面的
//                           热路径上,不该因为另一个服务抖动就把整站带下去。
// 所以本模块只负责"把失败如实抛出",由各调用点决定是硬失败还是软降级。

const BASE = env.COURSE_SCHEDULING_API_URL;
const SECRET = env.SITE_INGEST_SECRET;

/** 两边都配齐了才算接上。未配置时调用方会拿到 SiteApiError,而不是静默成功。 */
export const isSiteApiConfigured = Boolean(BASE && SECRET);

// 超时预算。不设的话 fetch 会一直等到对端 TCP 超时(可能数分钟),把本站的请求处理线程占住。
// 写入路径给得宽一些(它要跑一个数据库事务);弹窗读取必须短 —— 它卡住就等于首屏卡住。
const WRITE_TIMEOUT_MS = 8_000;
const READ_TIMEOUT_MS = 3_000;

export class SiteApiError extends Error {
	constructor(
		message: string,
		readonly status?: number
	) {
		super(message);
		this.name = 'SiteApiError';
	}
}

async function call<T>(
	path: string,
	init: { method: 'GET' | 'POST'; body?: unknown; timeoutMs: number }
): Promise<T> {
	if (!BASE || !SECRET) {
		throw new SiteApiError(
			'COURSE_SCHEDULING_API_URL / SITE_INGEST_SECRET 未配置 —— 无法读写官网运营数据'
		);
	}

	// AbortSignal.timeout 在超时时以 TimeoutError 中止 fetch,所以不需要手工 setTimeout + clear。
	let res: Response;
	try {
		res = await fetch(`${BASE.replace(/\/+$/, '')}${path}`, {
			method: init.method,
			headers: {
				'x-site-secret': SECRET,
				...(init.body === undefined ? {} : { 'content-type': 'application/json' })
			},
			body: init.body === undefined ? undefined : JSON.stringify(init.body),
			signal: AbortSignal.timeout(init.timeoutMs)
		});
	} catch (e) {
		// 网络层失败(DNS、连接拒绝、超时)。包一层统一类型,调用点就不必分辨 fetch 的各种抛法。
		throw new SiteApiError(`调用 ${path} 失败: ${e instanceof Error ? e.message : String(e)}`);
	}

	// 响应体可能不是 JSON(网关的 502 HTML 页)。解析失败不该掩盖掉真正的状态码。
	const payload = (await res.json().catch(() => null)) as {
		success?: boolean;
		data?: T;
		error?: string;
	} | null;

	if (!res.ok || !payload?.success) {
		throw new SiteApiError(payload?.error ?? `HTTP ${res.status}`, res.status);
	}
	return payload.data as T;
}

export interface SiteContactPayload {
	name: string;
	email: string;
	phone?: string | null;
	message?: string | null;
	subscribe: boolean;
	locale?: 'en' | 'zh' | null;
	grade?: number | null;
	programs: string[];
	topic?: 'program' | 'join' | 'general' | null;
	source?: string | null;
}

/** 落库一条询盘(subscribe 为真时同事务 upsert 订阅者)。失败必须由调用方硬失败。 */
export async function postContact(payload: SiteContactPayload): Promise<void> {
	await call<unknown>('/api/site/contact', {
		method: 'POST',
		body: payload,
		timeoutMs: WRITE_TIMEOUT_MS
	});
}

/**
 * 订阅三态结果 —— 本站据此还原原有行为:
 *   created        → 发欢迎信(只有真正插入的那一方发 ⇒ 并发不会重复发)
 *   reactivated    → 不发信
 *   already_active → 回 409「该邮箱已订阅」
 */
export type SubscribeOutcome = 'created' | 'reactivated' | 'already_active';

export async function postSubscribe(payload: {
	email: string;
	name?: string | null;
}): Promise<SubscribeOutcome> {
	const data = await call<{ outcome: SubscribeOutcome }>('/api/site/subscribe', {
		method: 'POST',
		body: payload,
		timeoutMs: WRITE_TIMEOUT_MS
	});
	return data.outcome;
}

/** 当前生效的弹窗(无则 null)。失败必须由调用方软降级 —— 见 popup-cache.ts。 */
export async function fetchActivePopup(): Promise<unknown> {
	return call<unknown>('/api/site/popups/active', {
		method: 'GET',
		timeoutMs: READ_TIMEOUT_MS
	});
}
