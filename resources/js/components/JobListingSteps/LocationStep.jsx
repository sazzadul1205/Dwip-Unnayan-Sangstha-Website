// resources/js/components/JobListingSteps/LocationStep.jsx

import React from 'react';
import { StepWrapper } from './StepWrapper';

export const LocationStep = ({ formData, errors, handleChange, locations }) => {
  const [selectedLocationId, setSelectedLocationId] = React.useState('');

  const handleArrayChange = (field, value) => {
    handleChange({ target: { name: field, value } });
  };

  const addLocation = () => {
    if (selectedLocationId && !formData.location_ids.includes(parseInt(selectedLocationId))) {
      handleArrayChange('location_ids', [...formData.location_ids, parseInt(selectedLocationId)]);
      setSelectedLocationId('');
    }
  };

  const removeLocation = (locationId) => {
    handleArrayChange('location_ids', formData.location_ids.filter(id => id !== locationId));
  };

  const selectedLocations = locations.filter(loc => formData.location_ids.includes(loc.id));

  return (
    <StepWrapper
      title="Location"
      description="Specify where this job is located"
      isActive={true}
      stepNumber={3}
    >
      <div className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Job Locations <span className="text-red-500">*</span>
          </label>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            >
              <option value="">Select a location</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addLocation}
              disabled={!selectedLocationId}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm sm:text-base"
            >
              Add Location
            </button>
          </div>

          {selectedLocations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-medium text-gray-700">Selected Locations:</p>
              <div className="space-y-2">
                {selectedLocations.map(location => (
                  <div key={location.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2 sm:gap-0">
                    <div>
                      <p className="text-sm sm:text-base font-medium text-gray-900">{location.name}</p>
                      {location.address && <p className="text-xs sm:text-sm text-gray-500">{location.address}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLocation(location.id)}
                      className="text-red-600 hover:text-red-800 text-sm sm:text-base"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.location_ids && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.location_ids}</p>}
          <p className="mt-2 text-[10px] sm:text-xs text-gray-500">Select at least one location</p>
        </div>
      </div>
    </StepWrapper>
  );
};