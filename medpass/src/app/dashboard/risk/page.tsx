'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface StrengthWeakness {
  subject: string;
  unit_type: string;
  performance_score: number;
}

interface MLPrediction {
  prediction: number;
  probability: number;
  prediction_text: string;
  confidence_score: number;
}

interface RiskAssessmentResponse {
  risk_score: number;
  risk_level: string;
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];
  ml_prediction: MLPrediction;
  details: Record<string, any>;
}

const RiskPage: React.FC = () => {
  const [risk, setRisk] = useState<RiskAssessmentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
    const { data: session, status } = useSession({
    required: true,
    onUnauthenticated: () => redirect('/auth/login'),
    });

  useEffect(() => {
    if (!session?.accessToken) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/inf/risk`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: RiskAssessmentResponse = await res.json();
        setRisk(data);
      })
      .catch((err) => {
        console.error('Failed to fetch risk:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  },  [session]);

  if (loading) return <div className="p-6 text-white">Loading risk assessment…</div>;
  if (error) return <div className="p-6 text-red-400">Error: {error}</div>;
  if (!risk) return null;

  // Tailwind classes for badge colors
  const levelColor =
    risk.risk_level === 'High' ? 'bg-red-600' :
    risk.risk_level === 'Medium' ? 'bg-yellow-600' : 'bg-green-600';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Sidebar />
      <div className="pl-[100px] p-6 max-w-4xl mx-auto space-y-6">

        {/* Overall Risk */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Overall Risk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-5xl font-extrabold text-white">{risk.risk_score.toFixed(1)}</span>
              <span className={`${levelColor} px-3 py-1 rounded-full font-medium text-white`}>  
                {risk.risk_level}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`${levelColor.replace('-600', '-400')} h-2 rounded-full`} 
                style={{ width: `${risk.risk_score}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Strengths & Weaknesses Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: 'Strengths', data: risk.strengths },
            { title: 'Weaknesses', data: risk.weaknesses }
          ].map(({ title, data }) => (
            <Card key={title} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <table className="w-full text-left text-white">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-2">Subject</th>
                        <th className="px-4 py-2">Unit</th>
                        <th className="px-4 py-2">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, i) => (
                        <tr key={i} className="border-t border-gray-700">
                          <td className="px-4 py-2">{item.subject}</td>
                          <td className="px-4 py-2">{item.unit_type}</td>
                          <td className="px-4 py-2">{item.performance_score.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ML Prediction */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">ML Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-white">
              <li><strong>Prediction:</strong> {risk.ml_prediction.prediction_text} ({risk.ml_prediction.prediction})</li>
              <li><strong>Probability:</strong> {(risk.ml_prediction.probability * 100).toFixed(1)}%</li>
              <li><strong>Confidence:</strong> {risk.ml_prediction.confidence_score.toFixed(1)}%</li>
            </ul>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Details</CardTitle>
          </CardHeader>
          <CardContent className="bg-gray-800 p-4 rounded">
            <pre className="text-xs text-white overflow-auto">{JSON.stringify(risk.details, null, 2)}</pre>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default RiskPage;