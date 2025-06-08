// src/types/task.ts
export interface Task {
  id: number | string
  title: string
  assignee: string
  planStart?: string
  planEnd?: string
  actualStart?: string
  actualEnd?: string
}