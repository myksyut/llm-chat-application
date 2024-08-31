import React, { useState } from 'react';
import { CheckCircle, Circle, Loader, ChevronDown, ChevronUp } from 'lucide-react';

const IntegratedProcessDisplay = ({ isLoading, processSteps, generatedQuery, searchResults }) => {
  const [expandedStep, setExpandedStep] = useState(null);

  const getCurrentStep = () => {
    const currentStepIndex = processSteps.findIndex(step => !step.completed);
    return currentStepIndex === -1 ? processSteps.length - 1 : currentStepIndex;
  };

  const toggleStep = (index) => {
    setExpandedStep(expandedStep === index ? null : index);
  };

  const getStepDetails = (step) => {
    switch (step) {
      case 'クエリ生成':
        return generatedQuery;
      case 'データベース検索':
        return JSON.stringify(searchResults, null, 2);
      default:
        return null;
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg mb-4">
      <h3 className="text-lg font-semibold mb-4 text-center">実行プロセス</h3>
      <div className="space-y-4">
        {processSteps.map((step, index) => {
          const isCurrentStep = index === getCurrentStep() && isLoading;
          const isCompleted = step.completed;
          const stepDetails = getStepDetails(step.name);

          return (
            <div key={index} className="relative">
              <div className="flex items-center cursor-pointer" onClick={() => stepDetails && toggleStep(index)}>
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mr-4
                  ${isCurrentStep ? 'bg-blue-500 animate-pulse' : 
                    isCompleted ? 'bg-green-500' : 'bg-gray-600'}
                  transition-all duration-300 ease-in-out
                `}>
                  {isCurrentStep ? (
                    <Loader className="animate-spin" size={20} />
                  ) : isCompleted ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Circle size={20} />
                  )}
                </div>
                <span className={`
                  flex-grow text-sm
                  ${isCurrentStep ? 'text-blue-400 font-semibold' :
                    isCompleted ? 'text-green-400' : 'text-gray-400'}
                `}>
                  {step.name}
                </span>
                {stepDetails && (expandedStep === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
              </div>
              {expandedStep === index && stepDetails && (
                <div className="mt-2 ml-14 bg-gray-700 p-3 rounded-lg">
                  <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-40">
                    {stepDetails}
                  </pre>
                </div>
              )}
              {index < processSteps.length - 1 && (
                <div className={`
                  absolute left-5 top-10 bottom-0 w-0.5
                  ${index < getCurrentStep() ? 'bg-green-500' : 'bg-gray-600'}
                  transition-all duration-300 ease-in-out
                `} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IntegratedProcessDisplay;