// frontend/src/components/Onboarding.js
import React, { useState, useEffect } from 'react';
import { createProfile, getProfile } from '../services/onboardingService';

const studyStyleQuestions = [
  {
    id: 'environment',
    question: 'What environment do you study best in?',
    options: ['Quiet room', 'With background noise', 'In a group', 'Outside/nature']
  },
  {
    id: 'learning_preference',
    question: 'How do you prefer to learn new material?',
    options: ['Reading', 'Watching videos', 'Practice exercises', 'Teaching others']
  },
  {
    id: 'time_management',
    question: 'How do you manage your study time?',
    options: ['I plan everything in advance', 'I study when I feel motivated', 'I cram before deadlines', 'I study consistently throughout the term']
  },
  {
    id: 'note_taking',
    question: 'How do you take notes?',
    options: ['Detailed written notes', 'Visual maps/diagrams', 'Voice recordings', 'Digital/typed notes']
  },
  {
    id: 'review_method',
    question: 'How do you review what you\'ve studied?',
    options: ['Practice tests', 'Reread notes', 'Group discussion', 'Teaching the material']
  }
];

const Onboarding = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    user_id: user.user_id,
    study_style: '',
    preferred_study_time: '',
    grade_level: '',
    subjects: [],
    goals: '',
    quiz_responses: {}
  });

  // Check if user already has a profile
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const existingProfile = await getProfile(user.user_id);
        if (existingProfile) {
          setProfile(existingProfile);
          onComplete(); // Skip onboarding if profile exists
        }
      } catch (error) {
        // Profile doesn't exist, continue with onboarding
        console.log("No existing profile found, starting onboarding");
      }
    };

    checkProfile();
  }, [user.user_id, onComplete]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectToggle = (subject) => {
    setProfile(prev => {
      const subjects = [...prev.subjects];
      if (subjects.includes(subject)) {
        return { ...prev, subjects: subjects.filter(s => s !== subject) };
      } else {
        return { ...prev, subjects: [...subjects, subject] };
      }
    });
  };

  const handleQuizResponse = (questionId, answer) => {
    setProfile(prev => ({
      ...prev,
      quiz_responses: {
        ...prev.quiz_responses,
        [questionId]: answer
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      await createProfile(profile);
      onComplete();
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("There was an error saving your profile. Please try again.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Welcome to AI Study Coach!</h2>
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all" 
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
        <p className="text-center mt-2 text-sm text-gray-600">Step {step} of 3</p>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Basic Information</h3>
          
          <div>
            <label className="block text-gray-700 mb-2">Grade Level</label>
            <select 
              name="grade_level"
              value={profile.grade_level}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Grade Level</option>
              <option value="high_school">High School</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="graduate">Graduate</option>
              <option value="professional">Professional</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Preferred Study Time</label>
            <select 
              name="preferred_study_time"
              value={profile.preferred_study_time}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Preferred Time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="late_night">Late Night</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Subjects</label>
            <div className="grid grid-cols-2 gap-2">
              {['Mathematics', 'Science', 'History', 'English', 'Computer Science', 
                'Foreign Language', 'Arts', 'Business', 'Engineering'].map(subject => (
                <div key={subject} className="flex items-center">
                  <input 
                    type="checkbox" 
                    id={subject}
                    checked={profile.subjects.includes(subject)}
                    onChange={() => handleSubjectToggle(subject)}
                    className="mr-2"
                  />
                  <label htmlFor={subject}>{subject}</label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Study Goals</label>
            <textarea
              name="goals"
              value={profile.goals}
              onChange={handleInputChange}
              placeholder="What are your main study goals? (e.g., Improve grades, prepare for exams, etc.)"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Study Style Quiz</h3>
          <p className="text-gray-600">
            Let's find out your study style! Answer these questions to help us personalize your experience.
          </p>

          {studyStyleQuestions.map((q, index) => (
            <div key={q.id} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium mb-3">{index + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center">
                    <input
                      type="radio"
                      id={`${q.id}_${optIndex}`}
                      name={q.id}
                      value={option}
                      checked={profile.quiz_responses[q.id] === option}
                      onChange={() => handleQuizResponse(q.id, option)}
                      className="mr-2"
                    />
                    <label htmlFor={`${q.id}_${optIndex}`}>{option}</label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Back
            </button>
            <button
              onClick={() => {
                // Determine study style based on quiz answers
                const responses = profile.quiz_responses;
                let studyStyle = 'Balanced';
                
                // Simple algorithm to determine study style
                if (responses.environment === 'Quiet room' && 
                    responses.learning_preference === 'Reading' && 
                    responses.time_management === 'I plan everything in advance') {
                  studyStyle = 'Structured';
                } else if (responses.environment === 'With background noise' && 
                          responses.learning_preference === 'Watching videos') {
                  studyStyle = 'Visual';
                } else if (responses.environment === 'In a group' && 
                          responses.learning_preference === 'Teaching others') {
                  studyStyle = 'Social';
                }
                
                setProfile(prev => ({ ...prev, study_style: studyStyle }));
                setStep(3);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Your Study Profile</h3>
          
          <div className="p-6 bg-blue-50 rounded-lg">
            <h4 className="text-lg font-medium mb-4">Your Study Style: {profile.study_style}</h4>
            
            {profile.study_style === 'Structured' && (
              <div className="space-y-4">
                <p>You thrive with structure and organization. You prefer to work in quiet environments and follow detailed plans.</p>
                <h5 className="font-medium">Recommended Strategies:</h5>
                <ul className="list-disc pl-6">
                  <li>Create detailed study schedules</li>
                  <li>Use checklists and outlines</li>
                  <li>Set up dedicated quiet study spaces</li>
                  <li>Break large tasks into smaller, manageable steps</li>
                </ul>
              </div>
            )}
            
            {profile.study_style === 'Visual' && (
              <div className="space-y-4">
                <p>You learn best through visual aids and multimedia content. You can study with some background noise and prefer a more relaxed environment.</p>
                <h5 className="font-medium">Recommended Strategies:</h5>
                <ul className="list-disc pl-6">
                  <li>Use mind maps and diagrams</li>
                  <li>Watch educational videos</li>
                  <li>Create visual flashcards</li>
                  <li>Use color-coding in your notes</li>
                </ul>
              </div>
            )}
            
            {profile.study_style === 'Social' && (
              <div className="space-y-4">
                <p>You learn best through interaction and discussion. Teaching others helps solidify your understanding.</p>
                <h5 className="font-medium">Recommended Strategies:</h5>
                <ul className="list-disc pl-6">
                  <li>Form or join study groups</li>
                  <li>Use the "teach-back" method</li>
                  <li>Participate in class discussions</li>
                  <li>Find study partners for accountability</li>
                </ul>
              </div>
            )}
            
            {profile.study_style === 'Balanced' && (
              <div className="space-y-4">
                <p>You have a flexible learning style that adapts to different situations. You can work well in various environments.</p>
                <h5 className="font-medium">Recommended Strategies:</h5>
                <ul className="list-disc pl-6">
                  <li>Mix up study methods for variety</li>
                  <li>Alternate between group and solo study</li>
                  <li>Use a combination of visual and written notes</li>
                  <li>Try different study environments to find what works best for each subject</li>
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Complete Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;