import Link from "next/link"
import { ArrowLeft, Github, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getAllProjects } from "@/lib/mdx"

export default async function ProjectsPage() {
  const projects = await getAllProjects()

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
              <Link href="/" className="text-zinc-400 hover:text-white text-sm">
                Home
              </Link>
              <Link href="/projects" className="text-zinc-400 hover:text-white text-sm">
                Projects
              </Link>
              <Link href="/blog" className="text-zinc-400 hover:text-white text-sm">
                Blog
              </Link>
              {/* <Link href="/courses" className="text-zinc-400 hover:text-white text-sm">
              Courses
              </Link> */}
              <Link href="/about" className="text-zinc-400 hover:text-white text-sm">
                About
              </Link>
             
          </nav>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <span className="sr-only">GitHub</span>
              <Github className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project) => (
              <Card key={project.slug} className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">
                      {project.title}
                      {project.featured && <span className="ml-2 text-orange-500">🔥</span>}
                    </CardTitle>
                    <div className="flex space-x-1">
                      {project.github && (
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link href={project.github} target="_blank">
                            <Github className="h-4 w-4" />
                            <span className="sr-only">GitHub</span>
                          </Link>
                        </Button>
                      )}
                      {project.link && (
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link href={project.link} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">Visit site</span>
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-zinc-400">
                  <p className="mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs bg-zinc-800 border-zinc-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-zinc-800">
                  <Link href={`/projects/${project.slug}`} className="text-sm text-zinc-400 hover:text-white">
                    View details →
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-6">No projects found. Create your first project to get started!</p>
            <div className="border border-dashed border-zinc-800 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-medium mb-4">How to add a project:</h3>
              <ol className="text-zinc-400 text-sm text-left space-y-3">
                <li>
                  1. Create a <code className="bg-zinc-800 px-1 py-0.5 rounded">content/projects</code> directory in
                  your project
                </li>
                <li>
                  2. Add a markdown file (e.g., <code className="bg-zinc-800 px-1 py-0.5 rounded">my-project.md</code>)
                </li>
                <li>
                  3. Include frontmatter at the top of your file:
                  <pre className="bg-zinc-800 p-3 rounded-md mt-2 text-xs overflow-x-auto">
                    {`---
title: "My Project"
description: "This is my awesome project"
date: "${new Date().toISOString().split("T")[0]}"
tags: ["react", "nextjs"]
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

