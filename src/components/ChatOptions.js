import React from 'react';
import { Cpu, GraduationCap, Briefcase, Star } from 'lucide-react';

const ChatOption = ({ icon, text, onClick }) => (
  <div onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700">
    {icon}
    <span className="mt-2 text-xs text-gray-400">{text}</span>
  </div>
);

const ChatOptions = ({ onOptionClick }) => (
  <div className="grid grid-cols-2 gap-2 w-full">
    <ChatOption icon={<Cpu size={30} />} text="スキル" onClick={() => onOptionClick("宮木翔太のスキルを教えて")} />
    <ChatOption icon={<GraduationCap size={30} />} text="学歴" onClick={() => onOptionClick("宮木翔太の学歴を教えて")} />
    <ChatOption icon={<Briefcase size={30} />} text="職歴" onClick={() => onOptionClick("宮木翔太のこれまでの仕事を教えて")} />
    <ChatOption icon={<Star size={30} />} text="強み" onClick={() => onOptionClick("宮木翔太の強みを教えて")} />
  </div>
);

export default ChatOptions;