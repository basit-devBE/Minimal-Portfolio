import type { ProjectMeta } from "./mdx"

export type ProjectCategory = "Personal Projects" | "Production Apps" | "Tools"

export interface ProjectWithCategory extends ProjectMeta {
  category?: ProjectCategory
}

