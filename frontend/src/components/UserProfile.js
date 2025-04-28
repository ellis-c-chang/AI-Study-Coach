// frontend/src/components/UserProfile.js
import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../services/onboardingService';

const UserProfile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile(user.user_id);
        setProfile(data);
        setEditedProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user.user_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectToggle = (subject) => {
    setEditedProfile(prev => {
      const subjects = [...prev.subjects];
      if (subjects.includes(subject)) {
        return { ...prev, subjects: subjects.filter(s => s !== subject) };
      } else {
        return { ...prev, subjects: [...subjects, subject] };
      }
    });
  };

  const handleSubmit = async () => {
    try {
      await updateProfile(user.user_id, editedProfile);
      setProfile(editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">
          Profile not found. Please complete the onboarding process.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Profile</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded ${
            isEditing 
              ? 'bg-gray-300 text-gray-700' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          
          <div className="mb-4">
            <p className="text-gray-600">Username</p>
            <p className="font-medium">{user.username}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600">Grade Level</p>
            {isEditing ? (
              <select 
                name="grade_level"
                value={editedProfile.grade_level}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="high_school">High School</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
                <option value="professional">Professional</option>
              </select>
            ) : (
              <p className="font-medium capitalize">
                {profile.grade_level?.replace('_', ' ')}
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600">Preferred Study Time</p>
            {isEditing ? (
              <select 
                name="preferred_study_time"
                value={editedProfile.preferred_study_time}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="late_night">Late Night</option>
              </select>
            ) : (
              <p className="font-medium capitalize">
                {profile.preferred_study_time?.replace('_', ' ')}
              </p>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Study Profile</h3>
          
          <div className="mb-4">
            <p className="text-gray-600">Study Style</p>
            <p className="font-medium">{profile.study_style}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600">Subjects</p>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                {['Mathematics', 'Science', 'History', 'English', 'Computer Science', 
                  'Foreign Language', 'Arts', 'Business', 'Engineering'].map(subject => (
                  <div key={subject} className="flex items-center">
                    <input 
                      type="checkbox" 
                      id={subject}
                      checked={editedProfile.subjects?.includes(subject)}
                      onChange={() => handleSubjectToggle(subject)}
                      className="mr-2"
                    />
                    <label htmlFor={subject}>{subject}</label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.subjects?.map(subject => (
                  <span 
                    key={subject}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Study Goals</h3>
        {isEditing ? (
          <textarea
            name="goals"
            value={editedProfile.goals}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            rows="3"
          ></textarea>
        ) : (
          <p className="bg-gray-50 p-4 rounded">{profile.goals}</p>
        )}
      </div>
      
      {isEditing && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;