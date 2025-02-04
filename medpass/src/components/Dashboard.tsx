'use client';

import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { api } from '@/lib/api';
import { UserData } from '@/types/userData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Dashboard() {
  const { getAccessTokenSilently, user } = useAuth0();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      try {
        if (!user?.sub) return;
        
        const token = await getAccessTokenSilently();
        // TODO NETID
        const data = await api.getUserData(token, user?.['netid'] || '');
        setUserData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [getAccessTokenSilently, user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!userData) {
    return <div>No user data found</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <pre>{JSON.stringify(userData.profile, null, 2)}</pre>
        </CardContent>
      </Card>

      {/* Student Information */}
      {userData.student_info && (
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre>{JSON.stringify(userData.student_info, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {/* Faculty Information */}
      {userData.faculty_info && (
        <Card>
          <CardHeader>
            <CardTitle>Faculty Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre>{JSON.stringify(userData.faculty_info, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {/* Enrollments */}
      {userData.enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <pre>{JSON.stringify(userData.enrollments, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {/* Exam Results */}
      {userData.exam_results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Exam Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre>{JSON.stringify(userData.exam_results, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}