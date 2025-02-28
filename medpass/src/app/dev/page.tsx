'use client';

import SystemsViewer from "@/components/SystemsViewer";
import Dashboard from "@/components/Dashboard";
import { Sidebar } from "lucide-react";

export default function DevPage() {
  return <SystemsViewer 
  highlightedSystems={['integumentary', 'cardiovascular', 'digestive', 'endocrine', 'lymphatic', 'muscular', 'nervous', 'reproductive', 'respiratory', 'skeletal', 'urinary']}
  />;
}