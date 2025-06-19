import React, { useState, useEffect, useRef } from 'react';
import { AIThinkingProcess as AIThinkingProcessType } from '../../Features/ai/types/AITypes';

interface ThinkingProcessProps {
    thinkingProcess: AIThinkingProcessType | null;
    isThinking: boolean;
    query?: string; // Make query optional to maintain compatibility
}

const AIThinkingProcess: React.FC<ThinkingProcessProps> = ({ thinkingProcess, isThinking, query = '' }) => {
    const [visibleSteps, setVisibleSteps] = useState<Array<{ step: number; title: string; description: string }>>([]);
    const [showConclusion, setShowConclusion] = useState(false);
    const [typedText, setTypedText] = useState<string>('');
    const [isInitialThinking, setIsInitialThinking] = useState(true);
    const typingRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize typing animation when thinking starts
    useEffect(() => {
        if (isThinking && isInitialThinking) {
            // Clear any previous text
            setTypedText('');

            // Initial thinking messages that appear before the formal steps
            const messages = [
                `> Analyzing query: "${query}"`,
                '> Searching property database...',
                '> Evaluating property features and preferences...'
            ];

            let currentMessageIndex = 0;
            let charIndex = 0;

            const typeNextChar = () => {
                if (currentMessageIndex < messages.length) {
                    if (charIndex < messages[currentMessageIndex].length) {
                        setTypedText(prev => prev + messages[currentMessageIndex][charIndex]);
                        charIndex++;
                        typingRef.current = setTimeout(typeNextChar, 20 + Math.random() * 30);
                    } else {
                        // Move to next message
                        charIndex = 0;
                        currentMessageIndex++;
                        setTypedText(prev => prev + '\n');
                        typingRef.current = setTimeout(typeNextChar, 500);
                    }
                } else {
                    // Initial thinking complete, move to formal steps
                    setIsInitialThinking(false);
                }
            };

            // Start typing
            typeNextChar();
        }

        // Clean up typing timeouts
        return () => {
            if (typingRef.current) clearTimeout(typingRef.current);
        };
    }, [isThinking, isInitialThinking, query]);

    // Handle formal thinking steps
    useEffect(() => {
        // Safety check for thinkingProcess and steps
        if (!thinkingProcess || !thinkingProcess.steps || !isThinking || isInitialThinking) {
            // If thinking completed, show all steps immediately
            if (thinkingProcess && thinkingProcess.steps && !isThinking) {
                setVisibleSteps(thinkingProcess.steps.filter(Boolean)); // Filter out any undefined items
                setShowConclusion(true);
                setIsInitialThinking(false);
                return;
            }
            return;
        }

        // Animated sequencing of steps with typing effect
        const stepsToShow = [...(thinkingProcess.steps || [])].filter(Boolean); // Make sure we have valid steps
        setVisibleSteps([]);

        let currentStep = 0;

        const showNextStep = () => {
            if (currentStep < stepsToShow.length) {
                // Show the step immediately to maintain your existing animation approach
                setVisibleSteps(prev => [...prev, stepsToShow[currentStep]]);

                // Move to next step after delay
                currentStep++;
                setTimeout(showNextStep, 700);
            } else {
                // All steps shown, show conclusion
                setTimeout(() => setShowConclusion(true), 500);
            }
        };

        // Start showing steps
        if (stepsToShow.length > 0) {
            showNextStep();
        }

    }, [thinkingProcess, isThinking, isInitialThinking]);

    // Scroll to bottom when content changes
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [typedText, visibleSteps, showConclusion]);

    if (!thinkingProcess && !isThinking) {
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

            {/* Terminal-like container */}
            <div
                ref={containerRef}
                className="bg-gray-900 rounded-lg shadow-md p-4 font-mono text-sm text-green-400 overflow-y-auto max-h-80"
                style={{ whiteSpace: 'pre-wrap' }}
            >
                {/* Show initial thinking animation */}
                {isThinking && isInitialThinking && (
                    <div>
                        {typedText}
                        <span className="animate-pulse inline-block w-2 h-5 bg-green-400 ml-1"></span>
                    </div>
                )}

                {/* Show formal steps */}
                {!isInitialThinking && (
                    <>
                        {/* Initial typing has completed, show formal steps */}
                        {isThinking && visibleSteps.length === 0 && (
                            <div className="animate-pulse">
                                <span className="text-yellow-300">Processing search request...</span>
                            </div>
                        )}

                        {/* Display completed steps with safety checks */}
                        {visibleSteps.filter(Boolean).map((step, idx) => (
                            <div key={idx} className="mb-4 pb-2 border-b border-gray-800">
                                <div className="text-purple-400 font-bold mb-1">
                                    {step?.step ? `Step ${step.step}: ${step.title || ''}` : `Step ${idx + 1}`}
                                </div>
                                <div className="text-green-300 pl-4">
                                    {step?.description || 'Processing...'}
                                </div>
                            </div>
                        ))}

                        {/* Show conclusion */}
                        {showConclusion && thinkingProcess?.conclusion && (
                            <div className="mt-4 pb-2 pt-2 border-t border-gray-800">
                                <div className="text-yellow-300 font-bold mb-1">
                                    Conclusion:
                                </div>
                                <div className="text-yellow-200 pl-4">
                                    {thinkingProcess.conclusion}
                                </div>

                                {!isThinking && (
                                    <div className="mt-4 text-green-400">
                                        <svg className="inline-block h-4 w-4 text-green-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Search completed successfully. Found
                                        <span className="text-white font-bold"> {(thinkingProcess.steps || []).length} </span>
                                        matching properties.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Show blinking cursor if still thinking */}
                        {isThinking && !showConclusion && (
                            <span className="animate-pulse inline-block w-2 h-5 bg-green-400 ml-1"></span>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AIThinkingProcess;