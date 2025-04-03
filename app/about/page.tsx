import Link from "next/link";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Logo and Navigation */}
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
            <Link href="/blog" className="text-zinc-400 hover:text-white text-sm">
              Blog
            </Link>
            {/* <Link href="/courses" className="text-zinc-400 hover:text-white text-sm">
              Courses
            </Link> */}
            <Link href="/about" className="bg-zinc-900 px-3 py-1 rounded-md text-sm">
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

        {/* Main Content */}
        <main className="max-w-2xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl font-bold mb-1">Basit <span className="text-zinc-500 text-sm"></span></h1>
            <p className="text-zinc-400 mb-8">Backend & Cloud Enthusiast ☁️</p>

            <div className="space-y-6 text-zinc-300">
              <p>
                From Ghana, passionate about architecting scalable backend systems and cloud solutions. I love solving complex problems with clean, efficient code.
              </p>
              <p>
                Exploring DevOps, automating workflows, and optimizing cloud infrastructure to build resilient, high-performing applications.
              </p>
              <p className="text-zinc-500">— Basit, building the cloud one service at a time.</p>
              <p>My journey is about continuous learning and pushing the boundaries of what’s possible in tech.</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="max-w-2xl mx-auto mt-24 pt-8 border-t border-zinc-800 text-zinc-500 text-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p>© 2025 Basit. All rights reserved.</p>
              <div className="flex flex-col md:flex-row gap-1 md:gap-4">
                <p className="text-xs">version <span className="text-emerald-500">1.0.0</span></p>
                <p className="text-xs">Next.js x Vercel</p>
                <p className="text-xs">
                  Source code: {" "}
                  <a href="https://github.com/basit/portfolio" className="hover:text-white">
                    github.com/basit/portfolio
                  </a>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
