import { useState, useRef, useEffect } from 'react';
import { ChevronRight, MessageSquare, SendHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';



const uiContext = `
RBAC UI Context:
- "Create Role" button: Adds a new role which can be assigned to routes, restricting access to only that role.
- "Create Pages" button: Adds new pages to the current root directory; these pages can be dragged into the scene.
- "Generate Middleware" button: Generates signup, login, 2FA verification, and files for role-based accessibility.
- "Connect" button: Allows you to connect roles to pages/routes by clicking a role and dragging an arrow to a route.
- "View Audit" button: Displays traffic logs, user activity, and visualization charts.
`;



export default function AIChat() {

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I can help you with your RBAC setup. How can I assist you today?' }
  ]);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || isLoading) return;
    
    setChatMessages(prev => [...prev, { role: 'user', content: inputMessage.trim() }]);
    const message = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message, 
          context: uiContext, 
          history: chatMessages 
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to get response');

      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message 
      }]);

    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      <div 
        className={`flex flex-col w-96 h-[32rem] bg-gray-900 border border-cyan-900/40 rounded-lg shadow-lg shadow-cyan-500/20 transition-all duration-300 ease-in-out ${
          isChatOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-cyan-900/40">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <span className="font-mono text-cyan-400">RBAC Assistant</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsChatOpen(false)}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-cyan-900/30 text-cyan-50' 
                    : 'bg-gray-800/80 text-gray-100'
                } font-mono text-sm`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-lg bg-gray-800/80 text-gray-100 font-mono text-sm animate-pulse">
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-cyan-900/40">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about RBAC..."
              className="flex-1 bg-gray-800 border-cyan-800 text-cyan-50 focus-visible:ring-cyan-500"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <Button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`mt-4 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 transition-transform duration-200 ${
          isChatOpen ? 'scale-90' : 'scale-100'
        }`}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        <span className="font-mono">RBAC Assistant</span>
      </Button>
    </div>
  );
}