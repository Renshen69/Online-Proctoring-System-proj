import { useState } from 'react';
import axios from 'axios';

interface Question {
  id?: number;
  question_text: string;
  question_type: 'mcq' | 'essay';
  points: number;
  options: MCQOption[];
}

interface MCQOption {
  id?: number;
  option_text: string;
  is_correct: boolean;
}

interface QuestionCreatorProps {
  sessionId: string;
  onQuestionAdded: () => void;
}

export default function QuestionCreator({ sessionId, onQuestionAdded }: QuestionCreatorProps) {
  const [questions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question_text: '',
    question_type: 'mcq',
    points: 1,
    options: []
  });
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, { option_text: '', is_correct: false }]
    }));
  };

  const updateOption = (index: number, field: keyof MCQOption, value: string | boolean) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const removeOption = (index: number) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleAddQuestion = async () => {
    if (!currentQuestion.question_text.trim()) {
      setError('Question text is required');
      return;
    }

    if (currentQuestion.question_type === 'mcq' && currentQuestion.options.length < 2) {
      setError('MCQ questions must have at least 2 options');
      return;
    }

    if (currentQuestion.question_type === 'mcq' && !currentQuestion.options.some(opt => opt.is_correct)) {
      setError('MCQ questions must have at least one correct option');
      return;
    }

    setIsAddingQuestion(true);
    setError('');

    try {
      // Add question
      const questionResponse = await axios.post(`http://127.0.0.1:8000/api/session/${sessionId}/questions`, {
        question_text: currentQuestion.question_text,
        question_type: currentQuestion.question_type,
        points: currentQuestion.points,
        order_index: questions.length
      });

      if (questionResponse.data.status === 'success') {
        const questionId = questionResponse.data.question_id;

        // Add options for MCQ questions
        if (currentQuestion.question_type === 'mcq') {
          for (let i = 0; i < currentQuestion.options.length; i++) {
            await axios.post(`http://127.0.0.1:8000/api/question/${questionId}/options`, {
              option_text: currentQuestion.options[i].option_text,
              is_correct: currentQuestion.options[i].is_correct,
              order_index: i
            });
          }
        }

        // Reset form
        setCurrentQuestion({
          question_text: '',
          question_type: 'mcq',
          points: 1,
          options: []
        });

        onQuestionAdded();
      } else {
        setError(questionResponse.data.message || 'Failed to add question');
      }
    } catch (error) {
      console.error('Error adding question:', error);
      setError('Failed to add question');
    } finally {
      setIsAddingQuestion(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Question</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text
            </label>
            <textarea
              value={currentQuestion.question_text}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question_text: e.target.value }))}
              placeholder="Enter your question here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type
              </label>
              <select
                value={currentQuestion.question_type}
                onChange={(e) => setCurrentQuestion(prev => ({ 
                  ...prev, 
                  question_type: e.target.value as 'mcq' | 'essay',
                  options: e.target.value === 'essay' ? [] : prev.options
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mcq">Multiple Choice</option>
                <option value="essay">Essay</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points
              </label>
              <input
                type="number"
                value={currentQuestion.points}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {currentQuestion.question_type === 'mcq' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Options
                </label>
                <button
                  type="button"
                  onClick={addOption}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                >
                  Add Option
                </button>
              </div>
              
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option.option_text}
                      onChange={(e) => updateOption(index, 'option_text', e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={option.is_correct}
                        onChange={(e) => updateOption(index, 'is_correct', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600">Correct</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="px-2 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleAddQuestion}
            disabled={isAddingQuestion}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingQuestion ? 'Adding Question...' : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  );
}
