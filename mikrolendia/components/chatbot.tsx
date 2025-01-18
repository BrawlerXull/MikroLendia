'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Mic, X } from 'lucide-react'
import { ScrollArea } from './ui/scroll-area'
import { Input } from './ui/input'
import useChainbot from '@/lib/hooks/useChainbot'

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const { messages, input, setInput, error, handleSend } = useChainbot([
    { role: 'bot', content: 'Hello! I\'m your MicronAI your AI assistant. How can I help you today?' },
  ]);

  const [isListening, setIsListening] = useState(false);
  const [speechRecognitionError, setSpeechRecognitionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();

      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'no-speech') {
          setSpeechRecognitionError('No speech detected, please try again.');
        } else if (event.error === 'audio-capture') {
          setSpeechRecognitionError('Audio capture failed. Please ensure your microphone is working.');
        } else {
          setSpeechRecognitionError('An error occurred with speech recognition.');
        }
      };
    } else {
      alert('Speech recognition is not supported in your browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);
      setSpeechRecognitionError(null); 
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

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
                  {speechRecognitionError && (
                    <div className="flex justify-start mb-4">
                      <div className="rounded-lg p-2 max-w-[70%] bg-red-500 text-white">
                        {speechRecognitionError}
                      </div>
                    </div>
                  )}
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
                  <button className=' bg-white p-2 rounded-full hover:bg-slate-100' onClick={toggleListening}>
                    <Mic className=' text-black' />
                  </button>
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
  );
}
