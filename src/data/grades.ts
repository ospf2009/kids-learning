/**
 * 年级配置数据
 */
export interface Grade {
  id: string
  name: string
  label: string
}

export const grades: Grade[] = [
  { id: 'grade1-up', name: '一年级上册', label: '一年级上' },
  { id: 'grade1-down', name: '一年级下册', label: '一年级下' },
  { id: 'grade2-up', name: '二年级上册', label: '二年级上' },
  { id: 'grade2-down', name: '二年级下册', label: '二年级下' },
]

export function getGradeById(id: string): Grade | undefined {
  return grades.find(g => g.id === id)
}

export function getGradeLabel(id: string): string {
  return getGradeById(id)?.label || '未知年级'
}

export function getGradeName(id: string): string {
  return getGradeById(id)?.name || '未知年级'
}
