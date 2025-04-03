import Link from "next/link"
import { ArrowLeft, Github, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getProjectBySlug, getAllProjects } from "@/lib/mdx"
import { MDXRemote } from "next-mdx-remote/rsc"
import { mdxComponents } from "@/components/mdx-components"

export async function generateStaticParams() {
  const projects = await getAllProjects()
  return projects.map((project) => ({
    slug: project.slug,
  }))
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const project = await getProjectBySlug(params.slug)

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12">
          <Link href="/projects" className="text-zinc-400 hover:text-white inline-flex items-center mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to projects
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold">
              {project.title}
              {project.featured && <span className="ml-2 text-orange-500">🔥</span>}
            </h1>
            <div className="flex space-x-2">
              {project.github && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={project.github} target="_blank" className="inline-flex items-center">
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </Link>
                </Button>
              )}
              {project.link && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={project.link} target="_blank" className="inline-flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <p className="text-zinc-400 mb-4">{project.description}</p>

          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="bg-zinc-800 border-zinc-700">
                {tag}
              </Badge>
            ))}
          </div>
        </header>

        {/* Project Content */}
        <div className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-yellow-500">
          <MDXRemote source={project.content} components={mdxComponents} />
        </div>
      </div>
    </div>
  )
}

