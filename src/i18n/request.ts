import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  // 1. 先从 Cookie 读取
  let locale = cookieStore.get('NEXT_LOCALE')?.value;

  // 2. 无 Cookie 时从 Accept-Language 检测
  if (!locale) {
    const acceptLang = headerStore.get('accept-language') || '';
    locale = acceptLang.includes('zh') ? 'zh' : 'en';
  }

  // 3. 验证 locale 合法性
  if (!['en', 'zh'].includes(locale)) {
    locale = 'en';
  }

  // 4. 按命名空间加载翻译文件并合并
  const modules = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/nav.json`),
    import(`../../messages/${locale}/home.json`),
    import(`../../messages/${locale}/about.json`),
    import(`../../messages/${locale}/programs.json`),
    import(`../../messages/${locale}/contact.json`),
    import(`../../messages/${locale}/admin.json`),
    import(`../../messages/${locale}/metadata.json`),
  ]);

  const messages = Object.assign({}, ...modules.map((m) => m.default));

  return { locale, messages };
});
