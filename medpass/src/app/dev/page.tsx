'use client';

import SystemsViewer from "@/components/SystemsViewer";
import Dashboard from "@/components/Dashboard";
import { Sidebar } from "lucide-react";
import EditableField from "@/components/EditableText";

export default function DevPage() {
  return <EditableField defaultValue="Initial Value" onUpdate={(newValue) => console.log(newValue)} />;
}