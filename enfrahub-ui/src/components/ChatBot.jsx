import { useState, useRef, useEffect } from 'react'
import { FloatButton } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './ChatBot.css'

function Chatbot() {
    // Chat box visibility
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [isChatMaximized, setIsChatMaximized] = useState(false)

    // Chat state
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [thinkingText, setThinkingText] = useState('...')
    const [conversationId, setConversationId] = useState(null)

    // Pool of rotating thinking phrases shown while waiting for the agent
    const fallbackPhrases = [
        'Working on it...',
        'Gathering information...',
        'Processing your request...',
        'Searching for answers...',
        'Putting it together...',
        'Almost there...',
        'Still working on it...',
    ]

    // Track whether fallback rotation has already been started
    const rotationStarted = useRef(false)

    // Rotate thinking phrases — wait 10s after the LLM phrase, then rotate every 10s
    useEffect(() => {
        if (!isLoading) {
            rotationStarted.current = false
            return
        }
        if (thinkingText === '...' || rotationStarted.current) return

        rotationStarted.current = true

        const timeoutCleanup = { current: null }

        const timeout = setTimeout(() => {
            setThinkingText(prev => {
                const available = fallbackPhrases.filter(p => p !== prev)
                return available[Math.floor(Math.random() * available.length)]
            })

            const interval = setInterval(() => {
                setThinkingText(prev => {
                    const available = fallbackPhrases.filter(p => p !== prev)
                    return available[Math.floor(Math.random() * available.length)]
                })
            }, 10000)

            timeoutCleanup.current = interval
        }, 10000)

        return () => {
            clearTimeout(timeout)
            if (timeoutCleanup.current) clearInterval(timeoutCleanup.current)
        }
    }, [isLoading, thinkingText])

    // Refs
    const messageEndRef = useRef(null)
    const chatContainerRef = useRef(null)
    const abortControllerRef = useRef(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Lock body scroll when chat is maximized
    useEffect(() => {
        if (isChatMaximized) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isChatMaximized])

    // Send message to the agent
    const sendMessage = async () => {
        if (!input.trim() || isLoading) return

        const currentInput = input
        const userMessage = { role: 'user', content: currentInput }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)
        setThinkingText('...')

        abortControllerRef.current = new AbortController()

        // Fire off the 'think' request concurrently
        // (Removed to keep simple loading bubble)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.content, conversationId }),
                signal: abortControllerRef.current.signal,
            })

            const data = await response.json()

            if (data.reply) {
                if (data.conversationId) {
                    setConversationId(data.conversationId)
                }
                setIsLoading(false)
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
            } else {
                console.error('Agent returned an error:', data.error)
                setIsLoading(false)
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.error || 'Sorry, I encountered an error.',
                }])
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                setIsLoading(false)
                setMessages(prev => [...prev, { role: 'assistant', content: '_You stopped this response._' }])
                setInput(currentInput)
                return
            }
            console.error('Chat error:', error)
            setIsLoading(false)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Network error. Please try again.',
            }])
        }
    }

    // Stop response
    const stopResponse = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
    }

    // Clear chat
    const clearChat = () => {
        setMessages([])
        setConversationId(null)
        setThinkingText('...')
    }

    // Toggle maximize/minimize
    const toggleMaximize = () => {
        setIsChatMaximized(prev => !prev)
    }

    return (
        <div>
            {/* Backdrop overlay when maximized */}
            {isChatMaximized && isChatOpen && (
                <div className='chat-backdrop' onClick={toggleMaximize} />
            )}

            {/* Chat Box */}
            <div className={`position-fixed shadow rounded bottom-0 end-0 chatbot-chat-box ${isChatOpen ? 'chat-open' : 'chat-closed'} ${isChatMaximized ? 'chat-maximized' : ''}`}>
                {/* Header */}
                <div className={`chat-header p-2 d-flex justify-content-between align-items-center ${isChatMaximized ? '' : 'rounded-top'}`}>
                    <span className='fw-bold text-white'>EnfraHub HR Assistant</span>
                    <div className='d-flex align-items-center gap-2'>
                        {messages.length > 0 && (
                            <button
                                onClick={clearChat}
                                disabled={isLoading}
                                className='bg-transparent text-white border-0 p-0 px-1'
                                title='Clear Chat'
                                style={{ fontSize: '0.75rem', opacity: 0.8, cursor: 'pointer', outline: 'none' }}
                            >
                                <i className='bi bi-trash'></i>
                            </button>
                        )}
                        {/* Desktop Maximize/Minimize Button */}
                        {/* <button
                            onClick={toggleMaximize}
                            className='btn btn-sm text-white border-0 p-0 px-1 d-none d-md-block'
                            title={isChatMaximized ? 'Minimize' : 'Maximize'}
                            style={{ fontSize: '0.75rem', opacity: 0.8 }}
                        >
                            <i className={`bi ${isChatMaximized ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}`}></i>
                        </button> */}
                        {/* Mobile Close Button */}
                        <button
                            onClick={() => {
                                setIsChatOpen(false)
                                setTimeout(() => setIsChatMaximized(false), 300)
                            }}
                            className='bg-transparent text-white border-0 p-0 px-1 d-md-none'
                            title='Close'
                            style={{ fontSize: '1rem', opacity: 0.8, cursor: 'pointer', outline: 'none' }}
                        >
                            <i className='bi bi-x-lg'></i>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div
                    className='flex-grow-1 overflow-auto p-2 scrollbar-hide chat-messages-area'
                    ref={chatContainerRef}
                    style={{ fontSize: '0.85rem' }}
                >
                    {messages.length === 0 && !isLoading ? (
                        <div key={`welcome-${conversationId || 'new'}`} className='h-100 d-flex flex-column align-items-center justify-content-center text-center welcome-fade-in' style={{ fontSize: '0.8rem' }}>
                            <i className='bi bi-stars fs-1 mb-2 chat-welcome-icon'></i>
                            <span className='chat-welcome-text'>Ask me anything about HR policies</span>
                        </div>
                    ) : (
                        <div className='d-flex flex-column gap-3'>
                            {messages.map((msg, index) =>
                                msg.role === 'assistant' ? (
                                    <div key={index} className='d-flex align-items-start gap-2 animate-fade-in-up'>
                                        <div className='rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 chat-icon-circle' style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}>
                                            <i className='bi bi-stars'></i>
                                        </div>
                                        <div className='chat-bubble chat-bubble-assistant p-2 text-break' style={{ maxWidth: '85%' }}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    a: ({ node, href, ...props }) => <a
                                                        {...props}
                                                        href={href}
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                    />,
                                                    ul: ({ node, ...props }) => <ul className='ps-3 mb-1' {...props} />,
                                                    ol: ({ node, ...props }) => <ol className='ps-3 mb-1' {...props} />,
                                                    li: ({ node, ...props }) => <li className='mb-0' {...props} />
                                                }}
                                            >
                                                {msg.content.replace(/【.*?】/g, '')}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={index} className='d-flex justify-content-end animate-fade-in-up'>
                                        <div className='chat-bubble chat-bubble-user p-2 text-break' style={{ maxWidth: '85%' }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Typing Indicator */}
                            {isLoading && (
                                <div className='d-flex align-items-start gap-2'>
                                    <div className='rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 chat-icon-circle' style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}>
                                        <i className='bi bi-stars'></i>
                                    </div>
                                    <div className='chat-thinking-bubble p-2 d-flex align-items-center gap-1' style={{ minHeight: '36px' }}>
                                        {thinkingText === '...' ? (
                                            <>
                                                <div className='typing-dot'></div>
                                                <div className='typing-dot'></div>
                                                <div className='typing-dot'></div>
                                            </>
                                        ) : (
                                            <>
                                                <span className='spinner-border spinner-border-sm text-secondary' role='status' aria-hidden='true' style={{ width: '12px', height: '12px' }}></span>
                                                <span className='text-secondary fst-italic' style={{ fontSize: '0.8rem' }}>{thinkingText}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div ref={messageEndRef}></div>
                </div>

                {/* Input */}
                <div className='chat-input-area p-2'>
                    <div className='w-100 d-flex align-items-center justify-content-between'>
                        <input
                            type='text'
                            className='form-control chat-input-field w-100'
                            placeholder='Type a message...'
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
                                    e.preventDefault()
                                    sendMessage()
                                }
                            }}
                            disabled={isLoading}
                        />
                        <button
                            className='chat-send-btn fs-5'
                            onClick={isLoading ? stopResponse : sendMessage}
                            disabled={!isLoading && !input.trim()}
                            title={isLoading ? 'Stop generating' : 'Send message'}
                        >
                            {isLoading ? (
                                <i className='bi bi-stop-circle text-danger fs-5'></i>
                            ) : (
                                <SendOutlined />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <FloatButton
                className='fs-6'
                type='primary'
                style={{ width: 50, height: 50 }}
                icon={
                    <span style={{ position: 'relative', display: 'inline-flex', width: '1em', height: '1em' }}>
                        <span className={`chat-fab-icon ${isChatOpen ? 'icon-spin-out' : 'icon-spin-in'}`} style={{ position: 'absolute', inset: 0 }}>
                            <i className='bi bi-chat-left-text-fill'></i>
                        </span>
                        <span className={`chat-fab-icon ${isChatOpen ? 'icon-spin-in' : 'icon-spin-out'}`} style={{ position: 'absolute', inset: 0 }}>
                            <i className='bi bi-x-lg'></i>
                        </span>
                    </span>
                }
                onClick={() => {
                    const opening = !isChatOpen
                    setIsChatOpen(opening)
                    if (opening && window.innerWidth <= 768) {
                        setIsChatMaximized(true)
                    }
                }}
            />
        </div>
    )
}

export default Chatbot