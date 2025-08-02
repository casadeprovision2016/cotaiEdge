'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  online: boolean
  lastSeen?: string
}

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: string
  type: 'text' | 'file' | 'process'
  attachments?: {
    id: string
    name: string
    type: 'nlic' | 'cotai' | 'file'
    url?: string
  }[]
  edited?: boolean
  reactions?: { emoji: string; userId: string }[]
}

interface Conversation {
  id: string
  participants: string[]
  type: 'individual' | 'group'
  name?: string
  lastMessage?: Message
  unreadCount: number
  updatedAt: string
}

export default function MensagemPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Mock data
  const mockUsers: User[] = [
    { id: '1', name: 'João Silva', email: 'joao@empresa.com', online: true },
    { id: '2', name: 'Maria Santos', email: 'maria@empresa.com', online: true },
    { id: '3', name: 'Carlos Lima', email: 'carlos@empresa.com', online: false, lastSeen: '2 min atrás' },
    { id: '4', name: 'Ana Costa', email: 'ana@empresa.com', online: true },
    { id: '5', name: 'Equipe Cotações', email: 'equipe@empresa.com', online: true },
  ]

  const mockConversations: Conversation[] = [
    {
      id: '1',
      participants: ['1', user?.id || ''],
      type: 'individual',
      lastMessage: {
        id: '1',
        senderId: '1',
        content: 'Olá! Preciso revisar a cotação COT-2025-001',
        timestamp: '2025-01-10T14:30:00Z',
        type: 'text'
      },
      unreadCount: 2,
      updatedAt: '2025-01-10T14:30:00Z'
    },
    {
      id: '2',
      participants: ['2', user?.id || ''],
      type: 'individual',
      lastMessage: {
        id: '2',
        senderId: '2',
        content: 'Anexei o processo nLic da dispensa',
        timestamp: '2025-01-10T13:15:00Z',
        type: 'process'
      },
      unreadCount: 0,
      updatedAt: '2025-01-10T13:15:00Z'
    },
    {
      id: '3',
      participants: ['5', user?.id || ''],
      type: 'group',
      name: 'Equipe Cotações',
      lastMessage: {
        id: '3',
        senderId: '5',
        content: 'Reunião de alinhamento às 15h',
        timestamp: '2025-01-10T12:00:00Z',
        type: 'text'
      },
      unreadCount: 5,
      updatedAt: '2025-01-10T12:00:00Z'
    }
  ]

  const mockMessages: Message[] = [
    {
      id: '1',
      senderId: '1',
      content: 'Olá! Como está o andamento da cotação COT-2025-001?',
      timestamp: '2025-01-10T14:00:00Z',
      type: 'text'
    },
    {
      id: '2',
      senderId: user?.id || '',
      content: 'Oi João! A cotação está na fase de análise. Precisa de alguma informação específica?',
      timestamp: '2025-01-10T14:05:00Z',
      type: 'text'
    },
    {
      id: '3',
      senderId: '1',
      content: 'Sim, gostaria de revisar os anexos. Pode compartilhar o processo?',
      timestamp: '2025-01-10T14:10:00Z',
      type: 'text'
    },
    {
      id: '4',
      senderId: user?.id || '',
      content: 'Claro! Anexando o processo agora.',
      timestamp: '2025-01-10T14:15:00Z',
      type: 'process',
      attachments: [
        {
          id: 'proc1',
          name: 'COT-2025-001 - Material de Escritório',
          type: 'cotai'
        }
      ]
    },
    {
      id: '5',
      senderId: '1',
      content: 'Perfeito! Obrigado. Vou revisar e te dou um retorno em breve.',
      timestamp: '2025-01-10T14:20:00Z',
      type: 'text'
    }
  ]

  useEffect(() => {
    setUsers(mockUsers)
    setConversations(mockConversations)
    if (mockConversations.length > 0) {
      setSelectedConversation(mockConversations[0].id)
      setMessages(mockMessages)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: Message = {
      id: Date.now().toString(),
      senderId: user?.id || '',
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    toast({
      title: 'Mensagem enviada',
      description: 'Sua mensagem foi entregue com sucesso'
    })
  }

  const attachProcess = (type: 'nlic' | 'cotai') => {
    if (!selectedConversation) return

    const processMessage: Message = {
      id: Date.now().toString(),
      senderId: user?.id || '',
      content: `Anexou um processo ${type.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      type: 'process',
      attachments: [
        {
          id: `proc-${Date.now()}`,
          name: type === 'nlic' ? 'Processo nLic - Dispensa 014/2025' : 'Cotação COT-2025-002',
          type: type
        }
      ]
    }

    setMessages(prev => [...prev, processMessage])
    
    toast({
      title: 'Processo anexado',
      description: `Processo ${type.toUpperCase()} anexado à conversa`
    })
  }

  const getUserName = (userId: string) => {
    if (userId === user?.id) return 'Você'
    const foundUser = users.find(u => u.id === userId)
    return foundUser?.name || 'Usuário'
  }

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'group') return conversation.name
    const otherUserId = conversation.participants.find(p => p !== user?.id)
    return getUserName(otherUserId || '')
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥']

  return (
    <div className="h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex h-full">
        {/* Lista de Conversas */}
        <div className="w-1/4 border-r border-gray-200 flex flex-col">
          {/* Header da Lista */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h1 className="text-lg font-semibold text-gray-900">Mensagens</h1>
              <Button size="sm">
                <span className="mr-1">➕</span>
                Nova conversa
              </Button>
            </div>
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Lista de Conversas */}
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedConversation === conversation.id 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {(getConversationName(conversation) || 'G').charAt(0)}
                      </span>
                    </div>
                    {conversation.type === 'individual' && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {getConversationName(conversation)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.updatedAt)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.content || 'Sem mensagens'}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Área de Chat */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header do Chat */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-xs">
                        {(getConversationName(conversations.find(c => c.id === selectedConversation) || conversations[0]) || 'G').charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-medium text-gray-900">
                        {getConversationName(conversations.find(c => c.id === selectedConversation) || conversations[0])}
                      </h2>
                      <p className="text-xs text-green-600">Online</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => attachProcess('nlic')}
                    >
                      📎 nLic
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => attachProcess('cotai')}
                    >
                      📎 CotAi
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.senderId !== user?.id && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {getUserName(message.senderId)}
                        </p>
                      )}
                      
                      <p className="text-sm">{message.content}</p>
                      
                      {message.attachments && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className={`p-2 rounded border ${
                                message.senderId === user?.id
                                  ? 'border-blue-300 bg-blue-500'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">
                                  {attachment.type === 'nlic' ? '🔍' : '📋'}
                                </span>
                                <span className="text-xs font-medium">
                                  {attachment.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs mt-1 opacity-70">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    😀
                  </Button>
                  
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      className="w-full"
                    />
                    
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex space-x-1">
                        {emojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setNewMessage(prev => prev + emoji)
                              setShowEmojiPicker(false)
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
                <p className="text-sm">Escolha uma conversa para começar a trocar mensagens</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}