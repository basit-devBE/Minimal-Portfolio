import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllProjects } from "@/lib/mdx"
import type { ProjectWithCategory } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export default async function ProjectsPage() {
  const projects = await getAllProjects()

  // Group projects by category
  const groupedProjects: Record<string, ProjectWithCategory[]> = {
    "Personal Projects": [],
    "Production Apps": [],
    Tools: [],
  }

  projects.forEach((project) => {
    const projectWithCategory = { ...project } as ProjectWithCategory

    // Determine category based on tags
    if (project.tags.includes("production") || project.tags.includes("app")) {
      groupedProjects["Production Apps"].push(projectWithCategory)
    } else if (project.tags.includes("tool")) {
      groupedProjects["Tools"].push(projectWithCategory)
    } else {
      groupedProjects["Personal Projects"].push(projectWithCategory)
    }
  })

  // Get categories that have projects
  const categories = Object.keys(groupedProjects).filter((category) => groupedProjects[category].length > 0)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex space-x-1">
              <div className="h-4 w-4 rounded-full bg-orange-500"></div>
              <div className="h-4 w-4 rounded-full bg-emerald-500"></div>
              <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
            </Link>
          </div>
          <nav className="flex space-x-6">
            <Link href="/" className=" text-zinc-400 hover:text-white text-sm">
              Home
            </Link>
            <Link href="/projects" className="bg-zinc-900 px-3 py-1 rounded-md text-sm">
              Projects
            </Link>
            <Link href="/blog" className="text-zinc-400 hover:text-white text-sm">
              Blog
            </Link>
            <Link href="/about" className="text-zinc-400 hover:text-white text-sm">
              About
            </Link>
          </nav>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <span className="sr-only">Email</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </Button>
            <a href="https://www.github.com/basit-devBE" target="_blank" rel="noopener noreferrer">
               <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                 <Github className="h-5 w-5" />
                </Button>
            </a>
          </div>
          
        </header>
        <p className="text-zinc-400 mt-6 mb-10">
             As a Junior Developer I&apos;ve tried many and a lot of things. These are the ones I could collect and showcase, or just proud of them.
            I hope to continue on this path of learning and creating more exciting projects. Feel free to explore them below.
          </p>

        {/* Project Categories */}
        {categories.length > 0 ? (
          <div className="space-y-16">
            {categories.map((category) => (
              <section key={category}>
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <CategoryIcon category={category} />
                  <span className="ml-2">{category}</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groupedProjects[category].map((project) => (
                    <Card
                      key={project.slug}
                      className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors"
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">
                            {project.title}
                            {project.featured && <span className="ml-2 text-orange-500">🔥</span>}
                          </CardTitle>
                          {project.link && (
                            <span className="text-xs text-zinc-500">{getDomainFromUrl(project.link)}</span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm text-zinc-400">
                        <p className="mb-4">{project.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {project.tags
                            .filter((tag) => !["production", "app", "tool"].includes(tag))
                            .map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs bg-zinc-800 border-zinc-700">
                                {tag}
                              </Badge>
                            ))}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-4 border-t border-zinc-800">
                        <Link href={`/projects/${project.slug}`} className="text-zinc-400 hover:text-white text-sm">
                          View details →
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-6">No projects found. Create your first project to get started!</p>
            <div className="border border-dashed border-zinc-800 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-medium mb-4">How to add a project:</h3>
              <ol className="text-zinc-400 text-sm text-left space-y-3">
                <li>
                  1. Create a <code className="bg-zinc-800 px-1 py-0.5 rounded">content/projects</code> directory
                </li>
                <li>
                  2. Add a markdown file (e.g., <code className="bg-zinc-800 px-1 py-0.5 rounded">my-project.md</code>)
                </li>
                <li>
                  3. Include frontmatter with category tags:
                  <pre className="bg-zinc-800 p-3 rounded-md mt-2 text-xs overflow-x-auto">
                    {`---
title: "My Project"
description: "This is my awesome project"
date: "${new Date().toISOString().split("T")[0]}"
tags: ["production", "app", "nextjs"] # use "production", "app", or "tool" to categorize
featured: true
github: "https://github.com/yourusername/project"
link: "https://project-demo.com"
---`}
                  </pre>
                </li>
                <li>4. Write your project details in markdown format below the frontmatter</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper functions
function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "Personal Projects":
      return <span className="text-yellow-500">💡</span>
    case "Production Apps":
      return <span className="text-blue-500">🚀</span>
    case "Tools":
      return <span className="text-purple-500">🛠️</span>
    default:
      return <span className="text-gray-500">📁</span>
  }
}

function getDomainFromUrl(url: string) {
  try {
    const domain = new URL(url).hostname.replace("www.", "")
    return domain
  } catch (error) {
    return url
  }
}

