import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Cpu, GraduationCap, Briefcase, Star, Loader, CheckCircle, Circle} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

const APIProcessDisplay = ({ isLoading, processSteps }) => {
  const getCurrentStep = () => {
    const currentStepIndex = processSteps.findIndex(step => !step.completed);
    return currentStepIndex === -1 ? processSteps.length - 1 : currentStepIndex;
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">実行プロセス</h3>
      <ul className="space-y-2">
        {processSteps.map((step, index) => {
          const isCurrentStep = index === getCurrentStep() && isLoading;
          const isCompleted = step.completed;

          return (
            <li 
              key={index} 
              className={`flex items-center transition-all duration-300 ease-in-out ${
                isCurrentStep ? 'text-blue-400' :
                isCompleted ? 'text-green-500' : 'text-gray-400'
              }`}
            >
              {isCurrentStep ? (
                <Loader className="animate-spin mr-2" size={16} />
              ) : isCompleted ? (
                <CheckCircle className="mr-2" size={16} />
              ) : (
                <Circle className="mr-2" size={16} />
              )}
              <span>{step.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const ChatOption = ({ icon, text, onClick }) => (
  <div onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700">
    {icon}
    <span className="mt-2 text-xs text-gray-400">{text}</span>
  </div>
);

const ChatOptions = ({ onOptionClick }) => (
  <div className="grid grid-cols-2 gap-4 mb-8">
    <ChatOption icon={<Cpu size={24} />} text="スキルについて聞く" onClick={() => onOptionClick("宮木翔太のスキルを教えて")} />
    <ChatOption icon={<GraduationCap size={24} />} text="学歴について聞く" onClick={() => onOptionClick("宮木翔太の学歴を教えて")} />
    <ChatOption icon={<Briefcase size={24} />} text="職歴について聞く" onClick={() => onOptionClick("宮木翔太のこれまでの仕事を教えて")} />
    <ChatOption icon={<Star size={24} />} text="強みについて聞く" onClick={() => onOptionClick("宮木翔太の強みを教えて")} />
  </div>
);

const Message = ({ text, sender }) => (
  <div className={`flex justify-center mb-4`}>
    <div className={`max-w-2xl w-full p-4 rounded-lg ${sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
      {sender === 'bot' ? (
        <ReactMarkdown
        className="prose prose-invert max-w-none"
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                style={dracula}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }
        }}
      >
          {text}
        </ReactMarkdown>
      ) : (
        <p>{text}</p>
      )}
    </div>
  </div>
);

const ChatMessages = ({ messages, isLoading }) => (
  <div className="space-y-4">
    {messages.map((message, index) => (
      <Message key={index} {...message} />
    ))}
    {isLoading && (
      <div className="flex justify-center">
        <Loader className="animate-spin text-blue-500" size={24} />
      </div>
    )}
  </div>
);

const ChatInput = ({ inputMessage, setInputMessage, handleSendMessage, isLoading }) => (
  <div className="flex items-center bg-gray-700 rounded-lg">
    <input
      type="text"
      value={inputMessage}
      onChange={(e) => setInputMessage(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && !isLoading) {
          handleSendMessage(inputMessage);
        }
      }}
      placeholder="メッセージを送信する"
      className="flex-1 p-4 bg-transparent outline-none text-white"
      disabled={isLoading}
    />
    <button
      onClick={() => handleSendMessage(inputMessage)}
      className={`p-4 ${isLoading ? 'text-gray-500 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
      disabled={isLoading}
    >
      {isLoading ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
    </button>
  </div>
);

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processSteps, setProcessSteps] = useState([
    { name: 'リクエスト受信', completed: false },
    { name: 'クエリ生成', completed: false },
    { name: 'データベース検索', completed: false },
    { name: 'レスポンス生成', completed: false }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
    if (text.trim() === '' || isLoading) return;

    const newUserMessage = { text, sender: 'user' };
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);
    setProcessSteps(steps => steps.map(step => ({ ...step, completed: false })));

    try {
      const response = await fetch('https://llm-chat-application-backend.onrender.com/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: text,
          history: messages.concat(newUserMessage)
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let botResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        // eslint-disable-next-line no-loop-func
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(5));
              if (jsonData.process_step) {
                setProcessSteps(steps => steps.map(step =>
                  step.name === jsonData.process_step ? { ...step, completed: true } : step
                ));
              } else {
                botResponse += jsonData.text;
              }
            } catch (e) {
              console.error('Error parsing JSON:', e);
              botResponse += line.slice(5);
            }
          }
        });
        // eslint-disable-next-line no-loop-func
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1].sender === 'bot') {
            newMessages[newMessages.length - 1] = {
              text: botResponse,
              sender: 'bot'
            };
          } else {
            newMessages.push({
              text: botResponse,
              sender: 'bot'
            });
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { text: 'エラーが発生しました。もう一度お試しください。', sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleReset = () => {
    setMessages([]);
    setInputMessage('');
    setProcessSteps(steps => steps.map(step => ({ ...step, completed: false })));
  };

  const showProcessDisplay = isLoading || processSteps.some(step => step.completed);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex items-center justify-between p-4 bg-gray-800">
        <div className="flex items-center cursor-pointer" onClick={handleReset}>
          <MessageCircle className="mr-2" />
          <span>ChatMYK</span>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center">
            <ChatOptions onOptionClick={handleSendMessage} />
          </div>
        ) : (
          <>
            <div className="flex-grow">
              <ChatMessages messages={messages} isLoading={isLoading} />
            </div>
            {showProcessDisplay && (
              <div className="mt-4">
                <APIProcessDisplay isLoading={isLoading} processSteps={processSteps} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>
      <footer className="p-4 bg-gray-800">
        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </footer>
    </div>
  );
};

export default ChatApp;