import Link from "next/link"
import { Github, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Head from "next/head"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <>
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Logo and Navigation */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="h-4 w-4 rounded-full bg-orange-500"></div>
              <div className="h-4 w-4 rounded-full bg-emerald-500"></div>
              <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
            </div>
          </div>
          <nav className="flex space-x-6">
            <Link href="/" className="bg-zinc-900 px-3 py-1 rounded-md text-sm">
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
              <Mail className="h-5 w-5" />
            </Button>
            <a href="https://www.github.com/basit-devBE" target="_blank" rel="noopener noreferrer">
               <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                 <Github className="h-5 w-5" />
                </Button>
            </a>
          </div>
        </header>
        {/* Introduction */}
        <section className="mb-20">
          <div className="mb-2">
            <Badge variant="outline" className="text-emerald-500 border-emerald-500">
              Hello World
            </Badge>
            <p className="text-zinc-500 text-sm mt-1">いらっしゃいませ</p>
          </div>
          <h1 className="text-3xl font-bold mb-4">
          It's me, Basit<span className="text-yellow-500">.</span> I'm a software engineer and Computer Science student exploring everything that sparks my interest—backend development,
           cloud computing, Devops and Cloud and System architecture.
          </h1>
          <p className="text-zinc-400 mb-4">
            On this site, you&apos;ll find a few things I want you to know{" "}
            <Link href="/about" className="text-emerald-500 hover:underline">
              about me
            </Link>{" "}
            or{" "}
            <Link href="/projects" className="text-orange-500 hover:underline">
              stuff I&apos;m working on
            </Link>
            . If you want to know more and keep up, try following my socials or join my{" "}
            <Link href="#" className="text-indigo-400 hover:underline">
              Discord
            </Link>{" "}
            server.
          </p>
        </section>

        {/* Logo Circle */}
        <div className="flex justify-center mb-16">
          <div className="h-24 w-24 rounded-full border border-zinc-800 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center">
              <span className="text-yellow-500 font-bold">Basit</span>
            </div>
          </div>
        </div>

        {/* Featured Projects */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <span className="inline-block mr-2">📂</span> Featured
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Project 1 */}
  <Card className="bg-zinc-900 border-zinc-800">
    <CardHeader>
      <CardTitle className="text-lg">
        JobPortal API <span className="text-green-500">🚀</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-zinc-400">
      <p>A scalable job portal API built with Node.js, TypeScript, PostgreSQL, and Docker.</p>
    </CardContent>
    <CardFooter className="pt-4 border-t border-zinc-800 text-xs">
      <Link href="#" className="text-zinc-500 hover:text-white">
        github.com/basit-devBE/
      </Link>
    </CardFooter>
  </Card>

  {/* Project 2 */}
  <Card className="bg-zinc-900 border-zinc-800">
    <CardHeader>
      <CardTitle className="text-lg">CloudOps Toolkit</CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-zinc-400">
      <p>
        A collection of scripts and automation tools for managing cloud infrastructure and deployments using Terraform
        and Kubernetes.
      </p>
    </CardContent>
    <CardFooter className="pt-4 border-t border-zinc-800 text-xs">
      <Link href="/blog/cloudopstoolkit" className="text-zinc-500 hover:text-white">
      Cloud Ops Toolkit
      </Link>
    </CardFooter>
  </Card>

  {/* Project 3 */}
  <Card className="bg-zinc-900 border-zinc-800">
    <CardHeader>
      <CardTitle className="text-lg">
        <span className="text-blue-500">☁</span> DevOps Insights
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-zinc-400">
      <p>
        A blog where I share insights, best practices, and hands-on guides on backend development, cloud computing, and
        DevOps.
      </p>
    </CardContent>
    <CardFooter className="pt-4 border-t border-zinc-800 text-xs">
      <Link href="/blog/blog" className="text-zinc-500 hover:text-white">
        /blog
      </Link>
    </CardFooter>
  </Card>
</div>

        </section>

        {/* Footer */}
        <div className="mt-20 py-6 border-t border-zinc-900 text-center">
         
        </div>
        </div>
      </div>
    </>
  )
}
