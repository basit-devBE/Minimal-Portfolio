"use client"

import { useEffect, useState } from "react"

// Array of favicon designs with LARGER text
const favicons = [
  // Green square with B - LARGER
  `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#10B981"/>
    <path d="M9 24V8H17C18.3333 8 19.5 8.5 20.5 9.5C21.5 10.5 22 11.6667 22 13C22 14 21.6667 14.8333 21 15.5C20.3333 16.1667 19.5 16.6667 18.5 17C19.8333 17.3333 20.8333 17.9167 21.5 18.75C22.1667 19.5833 22.5 20.6667 22.5 22C22.5 23.6667 21.9167 25 20.75 26C19.5833 27 18.1667 27.5 16.5 27.5H9V24ZM13 15H16C16.8333 15 17.4167 14.7917 17.75 14.375C18.0833 13.9583 18.25 13.5 18.25 13C18.25 12.5 18.0833 12.0417 17.75 11.625C17.4167 11.2083 16.8333 11 16 11H13V15ZM13 24H16.5C17.5 24 18.25 23.7917 18.75 23.375C19.25 22.9583 19.5 22.3333 19.5 21.5C19.5 20.6667 19.25 20.0417 18.75 19.625C18.25 19.2083 17.5 19 16.5 19H13V24Z" fill="white"/>
  </svg>`,

  // Purple circle with B - LARGER
  `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#8B5CF6"/>
    <path d="M9 24V8H17C18.3333 8 19.5 8.5 20.5 9.5C21.5 10.5 22 11.6667 22 13C22 14 21.6667 14.8333 21 15.5C20.3333 16.1667 19.5 16.6667 18.5 17C19.8333 17.3333 20.8333 17.9167 21.5 18.75C22.1667 19.5833 22.5 20.6667 22.5 22C22.5 23.6667 21.9167 25 20.75 26C19.5833 27 18.1667 27.5 16.5 27.5H9V24ZM13 15H16C16.8333 15 17.4167 14.7917 17.75 14.375C18.0833 13.9583 18.25 13.5 18.25 13C18.25 12.5 18.0833 12.0417 17.75 11.625C17.4167 11.2083 16.8333 11 16 11H13V15ZM13 24H16.5C17.5 24 18.25 23.7917 18.75 23.375C19.25 22.9583 19.5 22.3333 19.5 21.5C19.5 20.6667 19.25 20.0417 18.75 19.625C18.25 19.2083 17.5 19 16.5 19H13V24Z" fill="white"/>
  </svg>`,

  // Blue hexagon with B - LARGER
  `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0L29.8564 8V24L16 32L2.14359 24V8L16 0Z" fill="#3B82F6"/>
    <path d="M9 24V8H17C18.3333 8 19.5 8.5 20.5 9.5C21.5 10.5 22 11.6667 22 13C22 14 21.6667 14.8333 21 15.5C20.3333 16.1667 19.5 16.6667 18.5 17C19.8333 17.3333 20.8333 17.9167 21.5 18.75C22.1667 19.5833 22.5 20.6667 22.5 22C22.5 23.6667 21.9167 25 20.75 26C19.5833 27 18.1667 27.5 16.5 27.5H9V24ZM13 15H16C16.8333 15 17.4167 14.7917 17.75 14.375C18.0833 13.9583 18.25 13.5 18.25 13C18.25 12.5 18.0833 12.0417 17.75 11.625C17.4167 11.2083 16.8333 11 16 11H13V15ZM13 24H16.5C17.5 24 18.25 23.7917 18.75 23.375C19.25 22.9583 19.5 22.3333 19.5 21.5C19.5 20.6667 19.25 20.0417 18.75 19.625C18.25 19.2083 17.5 19 16.5 19H13V24Z" fill="white"/>
  </svg>`,

  // Orange diamond with B - LARGER
  `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="0" width="22.63" height="22.63" transform="rotate(45 16 0)" fill="#F97316"/>
    <path d="M9 24V8H17C18.3333 8 19.5 8.5 20.5 9.5C21.5 10.5 22 11.6667 22 13C22 14 21.6667 14.8333 21 15.5C20.3333 16.1667 19.5 16.6667 18.5 17C19.8333 17.3333 20.8333 17.9167 21.5 18.75C22.1667 19.5833 22.5 20.6667 22.5 22C22.5 23.6667 21.9167 25 20.75 26C19.5833 27 18.1667 27.5 16.5 27.5H9V24ZM13 15H16C16.8333 15 17.4167 14.7917 17.75 14.375C18.0833 13.9583 18.25 13.5 18.25 13C18.25 12.5 18.0833 12.0417 17.75 11.625C17.4167 11.2083 16.8333 11 16 11H13V15ZM13 24H16.5C17.5 24 18.25 23.7917 18.75 23.375C19.25 22.9583 19.5 22.3333 19.5 21.5C19.5 20.6667 19.25 20.0417 18.75 19.625C18.25 19.2083 17.5 19 16.5 19H13V24Z" fill="white"/>
  </svg>`,

  // Red heart with B - LARGER
  `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 28C16 28 3 20 3 11C3 7 6 4 10 4C12.5 4 14.7 5.2 16 7C17.3 5.2 19.5 4 22 4C26 4 29 7 29 11C29 20 16 28 16 28Z" fill="#EF4444"/>
    <path d="M9 24V8H17C18.3333 8 19.5 8.5 20.5 9.5C21.5 10.5 22 11.6667 22 13C22 14 21.6667 14.8333 21 15.5C20.3333 16.1667 19.5 16.6667 18.5 17C19.8333 17.3333 20.8333 17.9167 21.5 18.75C22.1667 19.5833 22.5 20.6667 22.5 22C22.5 23.6667 21.9167 25 20.75 26C19.5833 27 18.1667 27.5 16.5 27.5H9V24ZM13 15H16C16.8333 15 17.4167 14.7917 17.75 14.375C18.0833 13.9583 18.25 13.5 18.25 13C18.25 12.5 18.0833 12.0417 17.75 11.625C17.4167 11.2083 16.8333 11 16 11H13V15ZM13 24H16.5C17.5 24 18.25 23.7917 18.75 23.375C19.25 22.9583 19.5 22.3333 19.5 21.5C19.5 20.6667 19.25 20.0417 18.75 19.625C18.25 19.2083 17.5 19 16.5 19H13V24Z" fill="white"/>
  </svg>`,

  // NEW: Gradient background with extra large B
  `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#EC4899;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="6" fill="url(#grad)"/>
    <text x="16" y="22" fontFamily="Arial" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle">B</text>
  </svg>`,

  // NEW: Animated pulse effect (works in some browsers)
  `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#10B981">
      <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
    </rect>
    <text x="16" y="22" fontFamily="Arial" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle">B</text>
  </svg>`,
]

export function AnimatedFavicon() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // Function to update the favicon
    const updateFavicon = () => {
      // Create a Blob from the SVG string
      const blob = new Blob([favicons[currentIndex]], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)

      // Find existing favicon or create a new one
      let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (!link) {
        link = document.createElement("link")
        link.rel = "icon"
        document.head.appendChild(link)
      }

      // Update the href
      link.href = url

      // Clean up the old URL to avoid memory leaks
      return () => URL.revokeObjectURL(url)
    }

    // Update favicon immediately
    const cleanup = updateFavicon()

    // Set up interval to change favicon every minute
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % favicons.length)
    }, 60000) // 60000 ms = 1 minute

    // For demo purposes, change more frequently (every 5 seconds)
    const demoInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % favicons.length)
    }, 5000) // 5000 ms = 5 seconds

    // Clean up on unmount
    return () => {
      cleanup()
      clearInterval(interval)
      clearInterval(demoInterval)
    }
  }, [currentIndex])

  // This component doesn't render anything visible
  return null
}

