import React, { useState, useEffect } from 'react';
import { AIThinkingProcess as AIThinkingProcessType } from '../../Features/ai/types/AITypes';

interface ThinkingProcessProps {
    thinkingProcess: AIThinkingProcessType | null;
    isThinking: boolean;
}

const AIThinkingProcess: React.FC<ThinkingProcessProps> = ({ thinkingProcess, isThinking }) => {
    const [visibleSteps, setVisibleSteps] = useState<Array<{ step: number; title: string; description: string }>>([]);
    const [showConclusion, setShowConclusion] = useState(false);

    // Create animated effect for steps appearing
    useEffect(() => {
        if (!thinkingProcess || !isThinking) {
            // If thinking completed, show all steps immediately
            if (thinkingProcess && !isThinking) {
                setVisibleSteps(thinkingProcess.steps);
                setShowConclusion(true);
                return;
            }
            setVisibleSteps([]);
            setShowConclusion(false);
            return;
        }

        // Animated sequencing of steps
        const stepsToShow = [...thinkingProcess.steps];
        setVisibleSteps([]);

        stepsToShow.forEach((step, index) => {
            setTimeout(() => {
                setVisibleSteps(prevSteps => [...prevSteps, step]);

                // Show conclusion after last step
                if (index === stepsToShow.length - 1) {
                    setTimeout(() => setShowConclusion(true), 1000);
                }
            }, (index + 1) * 700); // Stagger the steps
        });
    }, [thinkingProcess, isThinking]);

    if (!thinkingProcess) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-medium text-purple-900 flex items-center mb-4">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Thinking Process
                {isThinking && (
                    <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Thinking...
                    </span>
                )}
            </h3>

            {visibleSteps.length === 0 && isThinking && (
                <div className="p-8 flex justify-center">
                    <div className="animate-pulse flex space-x-4 w-full">
                        <div className="flex-1 space-y-4 py-1">
                            <div className="h-4 bg-purple-200 rounded w-3/4"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-purple-200 rounded"></div>
                                <div className="h-4 bg-purple-200 rounded w-5/6"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {visibleSteps.map((step) => (
                    <div
                        key={step.step}
                        className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-400 thinking-step"
                    >
                        <h4 className="font-medium text-purple-800 mb-2">
                            Step {step.step}: {step.title}
                        </h4>
                        <p className="text-gray-700 text-sm">{step.description}</p>
                    </div>
                ))}

                {showConclusion && thinkingProcess.conclusion && (
                    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-4 shadow-md border-l-4 border-indigo-500 thinking-conclusion">
                        <h4 className="font-medium text-indigo-900 mb-2">Conclusion</h4>
                        <p className="text-indigo-900">{thinkingProcess.conclusion}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIThinkingProcess;