import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ChatOptions from './ChatOptions';
import IntegratedProcessDisplay from './IntegratedProcessDisplay';

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
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [currentResponse, setCurrentResponse] = useState('');
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (text) => {
    if (text.trim() === '' || isLoading) return;

    const newUserMessage = { text, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);
    setProcessSteps(steps => steps.map(step => ({ ...step, completed: false })));
    setGeneratedQuery('');
    setSearchResults(null);
    setCurrentResponse('');

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: text,
          history: [...messages, newUserMessage]
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let botResponse = '';
      let isFirstChunk = true;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(5));
              if (jsonData.process_step) {
                setProcessSteps(steps => steps.map(step =>
                  step.name === jsonData.process_step ? { ...step, completed: true } : step
                ));
              } else if (jsonData.generated_query) {
                setGeneratedQuery(jsonData.generated_query);
              } else if (jsonData.search_results) {
                setSearchResults(jsonData.search_results);
              } else if (jsonData.text) {
                botResponse += jsonData.text;
                setCurrentResponse(botResponse);
                if (isFirstChunk) {
                  setMessages(prevMessages => [...prevMessages, { text: botResponse, sender: 'bot' }]);
                  isFirstChunk = false;
                } else {
                  setMessages(prevMessages => {
                    const newMessages = [...prevMessages];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.sender === 'bot') {
                      newMessages[newMessages.length - 1] = {
                        ...lastMessage,
                        text: botResponse
                      };
                    } else {
                      newMessages.push({ text: botResponse, sender: 'bot' });
                    }
                    return newMessages;
                  });
                }
              }
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
        });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.sender === 'bot' && lastMessage.text.trim() === '') {
            newMessages.pop();
          }
          newMessages.push({ text: 'プロセスが中断されました。', sender: 'bot' });
          return newMessages;
        });
      } else {
        console.error('Error:', error);
        setMessages(prevMessages => [...prevMessages, { text: 'エラーが発生しました。もう一度お試しください。', sender: 'bot' }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleReset = () => {
    if (isLoading) {
      handleAbort();
    }
    setMessages([]);
    setInputMessage('');
    setProcessSteps(steps => steps.map(step => ({ ...step, completed: false })));
    setIsLoading(false);
    setGeneratedQuery('');
    setSearchResults(null);
    setCurrentResponse('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <ChatHeader handleReset={handleReset} isLoading={isLoading} />
      <main className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto h-full">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <ChatOptions onOptionClick={handleSendMessage} />
            </div>
          ) : (
            <>
              <ChatMessages messages={messages} isLoading={isLoading} />
              <IntegratedProcessDisplay
                isLoading={isLoading}
                processSteps={processSteps}
                generatedQuery={generatedQuery}
                searchResults={searchResults}
              />
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <footer className="bg-gray-800 p-4">
        <div className="max-w-2xl mx-auto">
          <ChatInput
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            handleSendMessage={handleSendMessage}
            isLoading={isLoading}
            handleAbort={handleAbort}
          />
        </div>
      </footer>
    </div>
  );
};

export default ChatApp;