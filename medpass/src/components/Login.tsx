import React from 'react';
import SearchBar from './nolan-comp/SearchBar';
import { GraduationCap } from 'lucide-react';

const LoginLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      {/* Navigation */}
      <nav className="absolute top-0 right-0 p-4">
        <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
          Sign In
        </button>
        <button className="ml-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          Register
        </button>
      </nav>

      {/* Main Content */}
      <div className="w-full max-w-2xl mx-auto text-center mb-16">
        {/* Logo and Title */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2">MedPASS</h1>
          <p className="text-lg text-gray-600">
            Predictive Assessment for Student Success
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar placeholder="Search for medical resources, topics, or questions..." />

        {/* Quick Links */}
        <div className="mt-8 flex justify-center gap-4 text-sm">
          <button className="text-gray-600 hover:text-blue-600">
            Popular Topics
          </button>
          <span className="text-gray-300">•</span>
          <button className="text-gray-600 hover:text-blue-600">
            Study Guides
          </button>
          <span className="text-gray-300">•</span>
          <button className="text-gray-600 hover:text-blue-600">
            Practice Questions
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full py-4 text-center text-sm text-gray-500">
        © 2024 MedPASS. All rights reserved.
      </footer>
    </div>
  );
};

export default LoginLanding;