import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { getPostBySlug, getAllPosts } from "@/lib/mdx"
import { MDXRemote } from "next-mdx-remote/rsc"
import { mdxComponents } from "@/components/mdx-components"

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

interface BlogPost {
  slug: string;
  content: string;
  date: string;
  title: string;
  tags: string[];
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = (await getPostBySlug(params.slug)) as BlogPost;

  if (!post) {
    return <div>Post not found</div>
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12">
          <Link href="/blog" className="text-zinc-400 hover:text-white inline-flex items-center mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to blog
          </Link>

          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center text-zinc-400 mb-8">
            <time dateTime={post.date} className="text-sm">
              {formatDate(post.date)}
            </time>
            <span className="mx-2">•</span>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <span key={tag} className="text-sm text-zinc-500">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Post Content */}
        <div className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-yellow-500">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>
      </div>
    </div>
  )
}

