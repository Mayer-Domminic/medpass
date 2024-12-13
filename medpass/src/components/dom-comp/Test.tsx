const Test = ({ title = "Step 1 Success Prediction", className = "" }) => {
    return (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-gray-500">Based on current performance metrics</p>
          </div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">
            Download Report
          </button>
        </div>
    );
  };
  
export default Test;