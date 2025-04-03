import Link from "next/link"
import { ArrowLeft, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { getAllPosts } from "@/lib/mdx"

export default async function BlogPage() {
  const posts = await getAllPosts()

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Bar */}
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
            <Link href="/projects" className="text-zinc-400 hover:text-white text-sm">
              Projects
            </Link>
            <Link href="/blog" className="bg-zinc-900 px-3 py-1 rounded-md text-sm">
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
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <span className="sr-only">GitHub</span>
              <Github className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Blog Content */}
        <header className="mb-12">
          <Link href="/" className="text-zinc-400 hover:text-white inline-flex items-center mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
          <h1 className="text-3xl font-bold mb-4">Blog</h1>
          <p className="text-zinc-400">Thoughts, ideas, and tutorials on code, design, and creativity.</p>
        </header>

        {posts.length > 0 ? (
          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.slug} className="border-b border-zinc-800 pb-8">
                <Link href={`/blog/${post.slug}`} className="block group">
                  <div className="mb-2">
                    <time dateTime={post.date} className="text-xs text-zinc-500">
                      {formatDate(post.date)}
                    </time>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-yellow-500">{post.title}</h2>
                  <p className="text-zinc-400 text-sm mb-4">{post.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-xs text-zinc-500">#{tag}</span>
                    ))}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-6">No blog posts found. Create your first post to get started!</p>
            <div className="border border-dashed border-zinc-800 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-medium mb-4">How to add a blog post:</h3>
              <ol className="text-zinc-400 text-sm text-left space-y-3">
                <li>1. Create a <code className="bg-zinc-800 px-1 py-0.5 rounded">content/posts</code> directory in your project</li>
                <li>2. Add a markdown file (e.g., <code className="bg-zinc-800 px-1 py-0.5 rounded">my-first-post.md</code>)</li>
                <li>3. Include frontmatter at the top of your file:
                  <pre className="bg-zinc-800 p-3 rounded-md mt-2 text-xs overflow-x-auto">
                    {`---\ntitle: "My First Post"\ndescription: "This is my first blog post"\ndate: "${new Date().toISOString().split("T")[0]}"\ntags: ["blog", "coding"]\n---`}
                  </pre>
                </li>
                <li>4. Write your content in markdown format below the frontmatter</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
