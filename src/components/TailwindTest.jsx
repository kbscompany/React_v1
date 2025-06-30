import React from 'react';

function TailwindTest() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Tailwind CSS Test</h1>
      <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
        <p className="text-lg text-gray-700 mb-4">If you can see this styled correctly:</p>
        <ul className="space-y-2">
          <li className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span className="text-gray-600">Blue heading</span>
          </li>
          <li className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span className="text-gray-600">Gray background box</span>
          </li>
          <li className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span className="text-gray-600">Rounded corners & shadow</span>
          </li>
        </ul>
        <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Test Button
        </button>
      </div>
    </div>
  );
}

export default TailwindTest; 