"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ApiKeyDisplayProps {
  apiKey: string
  className?: string
}

export function ApiKeyDisplay({ apiKey, className = "" }: ApiKeyDisplayProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy API key",
        variant: "destructive",
      })
    }
  }

  const displayKey = isVisible 
    ? apiKey 
    : `${apiKey.substring(0, 8)}${'•'.repeat(Math.max(0, apiKey.length - 16))}${apiKey.substring(apiKey.length - 8)}`

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 p-2 bg-muted rounded border">
        <code className="flex-1 font-mono text-sm text-foreground select-all">
          {displayKey}
        </code>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVisibility}
            className="h-8 w-8 p-0"
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-8 w-8 p-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
