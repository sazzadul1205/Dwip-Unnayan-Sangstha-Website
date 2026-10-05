const ToggleGroup = ({
  isSubmitting = false,
  submitLabel = 'Save',
  statusValue = true,
  featuredValue = false,
  onStatusToggle,
  onFeaturedToggle,
  showFeatured = true,
}) => {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <button
            type="button"
            onClick={onStatusToggle}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              statusValue
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {statusValue ? '✅ Active' : '⛔ Inactive'}
          </button>
        </div>
        {showFeatured && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Featured:</label>
            <button
              type="button"
              onClick={onFeaturedToggle}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                featuredValue
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {featuredValue ? '⭐ Featured' : '☆ Not Featured'}
            </button>
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin">⏳</span> Saving...
          </>
        ) : (
          <>💾 {submitLabel}</>
        )}
      </button>
    </div>
  );
};

export default ToggleGroup;
