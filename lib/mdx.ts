import fs from "fs"
import path from "path"
import matter from "gray-matter"

// Types for project and post metadata
export interface ProjectMeta {
  title: string
  description: string
  date: string
  slug: string
  tags: string[]
  featured?: boolean
  github?: string
  link?: string
}

export interface PostMeta {
  title: string
  description: string
  date: string
  slug: string
  tags: string[]
}

// Get the correct content directory path
function getContentDirectory() {
  // In development and production, we need to use the correct path
  return path.join(process.cwd(), "content")
}

// Paths for content directories
const contentDirectory = getContentDirectory()
const projectsDirectory = path.join(contentDirectory, "projects")
const postsDirectory = path.join(contentDirectory, "posts")

// Ensure directories exist
function ensureDirectoriesExist() {
  const dirs = [contentDirectory, projectsDirectory, postsDirectory]

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

// Get all project files
export async function getAllProjects(): Promise<ProjectMeta[]> {
  ensureDirectoriesExist()

  try {
    if (!fs.existsSync(projectsDirectory)) {
      console.warn("Projects directory does not exist")
      return []
    }

    const fileNames = fs.readdirSync(projectsDirectory)
    const projects = fileNames
      .filter((fileName) => fileName.endsWith(".mdx") || fileName.endsWith(".md"))
      .map((fileName) => {
        const slug = fileName.replace(/\.mdx?$/, "")
        const fullPath = path.join(projectsDirectory, fileName)
        const fileContents = fs.readFileSync(fullPath, "utf8")
        const { data } = matter(fileContents)

        return {
          slug,
          title: data.title || slug,
          description: data.description || "",
          date: data.date || new Date().toISOString(),
          tags: data.tags || [],
          featured: data.featured || false,
          github: data.github || null,
          link: data.link || null,
        } as ProjectMeta
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return projects
  } catch (error) {
    console.error("Error getting projects:", error)
    return []
  }
}

// Get a specific project by slug
export async function getProjectBySlug(slug: string) {
  ensureDirectoriesExist()

  try {
    const fullPath = path.join(projectsDirectory, `${slug}.mdx`)
    const mdPath = path.join(projectsDirectory, `${slug}.md`)

    let filePath = ""
    if (fs.existsSync(fullPath)) {
      filePath = fullPath
    } else if (fs.existsSync(mdPath)) {
      filePath = mdPath
    } else {
      return null
    }

    const fileContents = fs.readFileSync(filePath, "utf8")
    const { data, content } = matter(fileContents)

    return {
      slug,
      title: data.title || slug,
      description: data.description || "",
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
      featured: data.featured || false,
      github: data.github || null,
      link: data.link || null,
      content,
    }
  } catch (error) {
    console.error(`Error getting project ${slug}:`, error)
    return null
  }
}

// Get all blog posts
export async function getAllPosts(): Promise<PostMeta[]> {
  ensureDirectoriesExist()

  try {
    if (!fs.existsSync(postsDirectory)) {
      console.warn("Posts directory does not exist")
      return []
    }

    const fileNames = fs.readdirSync(postsDirectory)
    const posts = fileNames
      .filter((fileName) => fileName.endsWith(".mdx") || fileName.endsWith(".md"))
      .map((fileName) => {
        const slug = fileName.replace(/\.mdx?$/, "")
        const fullPath = path.join(postsDirectory, fileName)
        const fileContents = fs.readFileSync(fullPath, "utf8")
        const { data } = matter(fileContents)

        return {
          slug,
          title: data.title || slug,
          description: data.description || "",
          date: data.date || new Date().toISOString(),
          tags: data.tags || [],
        } as PostMeta
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return posts
  } catch (error) {
    console.error("Error getting posts:", error)
    return []
  }
}

// Get a specific post by slug
export async function getPostBySlug(slug: string) {
  ensureDirectoriesExist()

  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`)
    const mdPath = path.join(postsDirectory, `${slug}.md`)

    let filePath = ""
    if (fs.existsSync(fullPath)) {
      filePath = fullPath
    } else if (fs.existsSync(mdPath)) {
      filePath = mdPath
    } else {
      return null
    }

    const fileContents = fs.readFileSync(filePath, "utf8")
    const { data, content } = matter(fileContents)

    return {
      slug,
      title: data.title || slug,
      description: data.description || "",
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
      content,
    }
  } catch (error) {
    console.error(`Error getting post ${slug}:`, error)
    return null
  }
}

