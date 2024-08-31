import React from 'react';
import { Send, Loader, StopCircle, RefreshCw } from 'lucide-react';

const ChatInput = ({ inputMessage, setInputMessage, handleSendMessage, isLoading, handleAbort, handleRegenerateAnswer, canRegenerateAnswer }) => (
  <div className="flex items-center space-x-2">
    <div className="flex-grow flex items-center bg-gray-700 rounded-lg overflow-hidden">
      <input
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !isLoading) {
            handleSendMessage(inputMessage);
          }
        }}
        placeholder="メッセージを送信"
        className="flex-grow p-3 bg-transparent outline-none text-white text-sm"
        disabled={isLoading}
      />
      <button
        onClick={() => handleSendMessage(inputMessage)}
        className={`p-3 ${isLoading ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:text-white'}`}
        disabled={isLoading}
        aria-label={isLoading ? "送信中" : "メッセージを送信"}
      >
        <Send size={20} />
      </button>
    </div>
    {isLoading ? (
      <button
        onClick={handleAbort}
        className="bg-gray-500 hover:bg-red-600 text-white p-3 rounded-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        aria-label="プロセスを中断"
        title="プロセスを中断"
      >
        <StopCircle size={20} />
      </button>
    ) : (
      <button
        onClick={handleRegenerateAnswer}
        className={`bg-gray-500 hover:bg-green-600 text-white p-3 rounded-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 ${
          !canRegenerateAnswer ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-label="回答を再生成"
        title="回答を再生成"
        disabled={!canRegenerateAnswer}
      >
        <RefreshCw size={20} />
      </button>
    )}
  </div>
);

export default ChatInput;