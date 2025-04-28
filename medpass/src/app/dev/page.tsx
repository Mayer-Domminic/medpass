'use client';

import SystemsViewer from "@/components/SystemsViewer";
import { Sidebar } from "lucide-react";
import EditableField from "@/components/EditableText";
import Question from "@/components/QuestionComp/Question";
import Domain from "@/components/results/domain";
import Subdomain from "@/components/results/subdomain";

export default function DevPage() {
  return <Domain title={"Title"} subdomains={[{ id: "1", title: "Subdomain Title", questions: [] }]} />;
}