import { test, expect } from '../fixtures/test'

// 班级工作台「排课」tab 的行内笔记/点评/成绩编辑 (project `staff`, default owner storageState → has
// lesson:update). Section A is seeded with lessons around "now" and an active enrollment for student A,
// so its 排课 list renders at least one lesson row with a rostered student. We open a lesson's inline
// editor, save the shared Summary, then (if a student row is present) a 点评 and a 成绩, asserting on the
// green success flash — never on global counts. Mirrors schedule.spec.ts.
test.describe('班级工作台 · 排课行内笔记点评', () => {
  test.beforeEach(async ({ page }) => {
    // Defensive: no native dialogs are expected here, but a registered handler keeps the run from
    // hanging if one ever surfaces (same rationale as schedule.spec.ts).
    page.on('dialog', (d) => d.accept())
  })

  test('展开课节 → 保存 Summary / 点评 / 成绩', async ({ page, seed }) => {
    await page.goto(`/dashboard/teach/${seed.sectionA.id}?tab=lessons`)

    // The inline editor's toggle appears on every lesson row; open the first one.
    const toggle = page.getByRole('button', { name: /笔记点评/ }).first()
    await expect(toggle).toBeVisible()
    await toggle.click()

    // Inline state is SSR-seeded via useState initializer (no client fetch), so there is no
    // controlled-component race — we can type immediately after the editor renders.
    const summary = page.getByPlaceholder('今天讲了…')
    await expect(summary).toBeVisible()
    await summary.fill(`E2E排课笔记-${Date.now()}`)

    // 本用例测的是「保存」，不是「发布」。PR#85 起新笔记的「对外开放」默认勾选，而这里打开的是
    // **section A** 的课节 —— 正是 portal project 默认 storageState(家长 A)能看到的那个班级。
    // 不取消就会把这条测试笔记真的发给家长,打红 tests/e2e/portal/notes.spec.ts 的空态用例
    // (project 顺序 auth-flows → public → staff → portal,共用同一个库)。
    // 这里只挂载一个内联笔记面板(section-lessons.tsx 的 notesOpenId 是单值),所以 locator 唯一。
    const shareToggle = page.getByRole('checkbox', { name: /对外开放/ })
    await shareToggle.uncheck()
    // 取消确实生效才继续 —— 受控组件,若被随后的 setState 覆盖回勾选,这里当场红掉,
    // 而不是静默把笔记发布出去、再去打红另一个文件里的用例。
    await expect(shareToggle).not.toBeChecked()

    await page.getByRole('button', { name: '保存笔记', exact: true }).click()
    await expect(page.getByText('已保存本节课笔记')).toBeVisible()

    // Section A has an active enrollment → at least one student row with 点评 + 成绩.
    const studentRows = page.getByTestId('lesson-note-student')
    if ((await studentRows.count()) > 0) {
      const row = studentRows.first()

      await row.locator('textarea').fill(`E2E点评-${Date.now()}`)
      await row.getByRole('button', { name: '保存点评', exact: true }).click()
      await expect(page.getByText('已保存点评')).toBeVisible()

      await row.getByPlaceholder('分数').fill('88')
      await row.getByPlaceholder('满分').fill('100')
      await row.getByRole('button', { name: '保存成绩', exact: true }).click()
      await expect(page.getByText('已保存成绩')).toBeVisible()
    }
  })

  test('一键保存全部更改：Summary + 点评 + 成绩 一次提交', async ({ page, seed }) => {
    await page.goto(`/dashboard/teach/${seed.sectionA.id}?tab=lessons`)

    const toggle = page.getByRole('button', { name: /笔记点评/ }).first()
    await expect(toggle).toBeVisible()
    await toggle.click()

    // 改动 Summary，并在有学生行时改动点评 + 成绩，然后仅点一次「一键保存全部更改」。
    const summary = page.getByPlaceholder('今天讲了…')
    await expect(summary).toBeVisible()
    await summary.fill(`E2E一键保存-${Date.now()}`)

    // 同上:测的是「一次提交三类改动」,不是「发布」。saveAll 的脏检查含 `shared !== init.shared`
    // 所以 visibility-only 的改动也会落库,取消勾选不会被当成"没改动"而跳过。
    const shareToggle = page.getByRole('checkbox', { name: /对外开放/ })
    await shareToggle.uncheck()
    await expect(shareToggle).not.toBeChecked()

    const studentRows = page.getByTestId('lesson-note-student')
    if ((await studentRows.count()) > 0) {
      const row = studentRows.first()
      await row.locator('textarea').fill(`E2E一键点评-${Date.now()}`)
      await row.getByPlaceholder('分数').fill('77')
      await row.getByPlaceholder('满分').fill('100')
    }

    await page.getByRole('button', { name: '一键保存全部更改', exact: true }).click()
    // Assert on the green success flash (汇总文案含「已保存全部更改」)，never on global counts.
    await expect(page.getByText(/已保存全部更改/)).toBeVisible()
  })
})
