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

        {/* Blog Intro Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <h1 className="text-2xl font-medium mb-8">Blog</h1>
          
          {/* Introduction paragraph - similar to the second image */}
          <p className="text-zinc-400 mb-8">
          I don't write with the expectation that what I say will immediately make an impact on you. Instead, I write with the understanding that many of the ideas and thoughts 
          we hold are often not entirely our own but rather the result 
          of seeds planted by countless people we've encountered and the experiences we've lived through—so many of which we've long forgotten the origins of.
           My writings, then, are simply another manifestation of these ideas, passing along what has been absorbed over time, like an echo of the influences and lessons we've encountered along the way.
          </p>
          
          <p className="text-zinc-400 mb-16">
          These words are my own, shaped by the unique experiences I've lived through. If you come across something that feels unclear, incorrect, or misleading, I invite you to let me know so I can improve. 
          And if you find anything that resonates or proves helpful, I'd be grateful if you shared it with your friends.
          </p>
          
          {/* Post counter */}
          <div className="text-sm text-zinc-500 mb-8">{posts.length} posts published</div>
        </div>

        {/* Blog Posts */}
        {posts.length > 0 ? (
          <div className="max-w-2xl mx-auto">
            {posts.map((post) => (
              <article key={post.slug} className="flex justify-between items-start border-t border-zinc-800 py-6 group">
                <Link href={`/blog/${post.slug}`} className="flex-1">
                  <h2 className="text-base font-normal group-hover:text-yellow-500">{post.title}</h2>
                  {post.tags && post.tags.includes("time-capsule") && (
                    <span className="inline-block text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded mt-1">time-capsule</span>
                  )}
                  {post.tags && post.tags.includes("disappointed") && (
                    <span className="inline-block text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded mt-1">disappointed</span>
                  )}
                </Link>
                <time dateTime={post.date} className="text-sm text-zinc-500 ml-4 mt-1">
                  {formatDate(post.date)}
                </time>
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