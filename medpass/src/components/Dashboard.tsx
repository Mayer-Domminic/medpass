import { useEffect, useState } from 'react';
import Sidebar from '@/components/navbar';
import StepOverview from '@/components/block_cards';

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area (2/3 width) */}
      <div className="w-2/3 pl-[72px]">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-white mb-8">USMLE Step 1</h1>
          <StepOverview />
        </div>
      </div>

      {/* Right Container (1/3 width) */}
      <div className="w-1/3 border-l border-gray-800">
        {/* Content for right container will go here */}
      </div>
    </div>
  );
}

export default Dashboard;

{/* Welcome Card - Commented out */}
{/* <div className="bg-white shadow rounded-lg p-6">
  <div className="flex justify-between items-center">
    <h1 className="text-2xl font-bold text-gray-900">
      Welcome, {user?.net_id}!
    </h1>
    <LogoutButton />
  </div>
</div> */}

{/* Student Details Card - Commented out */}
{/* <div className="mt-6 bg-white shadow rounded-lg p-6">
  <h2 className="text-xl font-bold text-gray-900 mb-4">Student Details</h2>
  {loading ? (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  ) : error ? (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <p className="text-yellow-700">{error}</p>
    </div>
  ) : student ? (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Cumulative GPA</p>
          <p className="mt-1 text-lg font-semibold">{student.cum_total_gpa?.toFixed(2) || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">BCPM GPA</p>
          <p className="mt-1 text-lg font-semibold">{student.cum_bcpm_gpa?.toFixed(2) || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Graduation Year</p>
          <p className="mt-1 text-lg font-semibold">{student.grad_year || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Status</p>
          <p className="mt-1 text-lg font-semibold">{student.graduated ? 'Graduated' : 'In Progress'}</p>
        </div>
      </div>
    </div>
  ) : (
    <p className="text-gray-500">No student data available.</p>
  )}
</div> */}

  // const { user } = useAuth();
  // const [student, setStudent] = useState(null);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);

  // useEffect(() => {
  //   if (user?.net_id) {
  //     const fetchStudentData = async () => {
  //       try {
  //         const studentData = await authApi.getStudentByNetId(user.net_id);
  //         setStudent(studentData);
  //       } catch (err) {
  //         if (err.response?.status === 404) {
  //           setError(`No student record found for ${user.net_id}. Please ensure your student record has been imported.`);
  //         } else {
  //           setError(err.message || 'Failed to fetch student data');
  //         }
  //       } finally {
  //         setLoading(false);
  //       }
  //     };

  //     fetchStudentData();
  //   }
  // }, [user?.net_id]);