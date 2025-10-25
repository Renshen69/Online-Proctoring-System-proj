import { useState, useEffect } from 'react';
import axios from 'axios';

interface Question {
  id: number;
  question_text: string;
  question_type: 'mcq' | 'essay';
  points: number;
  options: MCQOption[];
}

interface MCQOption {
  id: number;
  option_text: string;
  is_correct: boolean;
}

interface Answer {
  question_id: number;
  answer_text?: string;
  selected_option_id?: number;
}

interface CustomExamProps {
  sessionId: string;
  rollNo: string;
  examTitle: string;
  examDescription?: string;
}

export default function CustomExam({ sessionId, rollNo, examTitle, examDescription }: CustomExamProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [sessionId]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/session/${sessionId}/questions`);
      if (response.data.status === 'success') {
        setQuestions(response.data.questions);
      } else {
        setError('Failed to load questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, value: string | number, type: 'text' | 'option') => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        ...(type === 'text' ? { answer_text: value as string } : { selected_option_id: value as number })
      }
    }));
  };

  const handleSubmitAnswer = async (questionId: number) => {
    const answer = answers[questionId];
    if (!answer) return;

    try {
      await axios.post(`http://127.0.0.1:8000/api/session/${sessionId}/student/${rollNo}/answer`, {
        question_id: questionId,
        answer_text: answer.answer_text,
        selected_option_id: answer.selected_option_id
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSaveAndNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (answers[currentQuestion.id]) {
      handleSubmitAnswer(currentQuestion.id);
    }
    handleNextQuestion();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600">No questions available for this exam.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{examTitle}</h1>
            {examDescription && (
              <p className="text-gray-600 mt-1">{examDescription}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
            <p className="text-sm text-gray-500">{currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              {currentQuestion.question_text}
            </h2>

            {currentQuestion.question_type === 'mcq' ? (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${currentAnswer?.selected_option_id === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name={`question_${currentQuestion.id}`}
                      value={option.id}
                      checked={currentAnswer?.selected_option_id === option.id}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, parseInt(e.target.value), 'option')}
                      className="mr-3"
                    />
                    <span className="text-gray-900">{option.option_text}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div>
                <textarea
                  value={currentAnswer?.answer_text || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value, 'text')}
                  placeholder="Enter your answer here..."
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center space-x-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium ${index === currentQuestionIndex
                  ? 'bg-blue-500 text-white'
                  : answers[questions[index].id]
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                  }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={handleSaveAndNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save & Next
            </button>
          ) : (
            <button
              onClick={() => handleSubmitAnswer(currentQuestion.id)}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Answer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
