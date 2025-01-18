'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, X } from 'lucide-react'
import { ScrollArea } from './ui/scroll-area'
import { Input } from './ui/input'

import useChainbot from '@/lib/hooks/useChainbot'

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)

  const { messages, input, setInput, error, handleSend } = useChainbot([
    { role: 'bot', content: 'Hello! I\'m your MicronAI your AI assistant. How can I help you today?' },
  ]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className=''>
        <div className='flex justify-between'>
            <div>
                <CardTitle>MicronAI Assistant</CardTitle>
                <CardDescription>Chat with our AI for support and guidance</CardDescription>
            </div>

            <div>
                <Button variant="ghost" size="sm" className="px-2 py-0" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[370px] w-full pr-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className={`rounded-lg p-2 max-w-[70%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                {message.content}
              </div>
            </div>
          ))}
          {/* {loading && (
            <div className="flex gap-2 items-center">
              <div className="w-2 h-2 rounded-full animate-bounce bg-gray-600"></div>
              <div className="w-3 h-3 rounded-full animate-bounce bg-gray-600"></div>
              <div className="w-4 h-4 rounded-full animate-bounce bg-gray-600"></div>
            </div>
          
          )} */}
          {error && (
            <div className="flex justify-start mb-4">
              <div className="rounded-lg p-2 max-w-[70%] bg-red-500 text-white">
                {error}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex w-full space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
          />
          <Button type="submit" >Send</Button>
        </form>
      </CardFooter>
    </Card>
          </motion.div>
        )}
      </AnimatePresence>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="rounded-full h-12 w-12"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}

