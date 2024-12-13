import React from 'react';
import Test from '@/components/dom-comp/Test';

const Dashboard = () => {
  return (
    <>
    <Test title="Step 1 Success Prediction" className="mb-4" />
    <Test title="Step 2 Performance Analysis" className="mb-4" />
    <Test title="Step 3 Final Results" />
    </>
  );
};

export default Dashboard;