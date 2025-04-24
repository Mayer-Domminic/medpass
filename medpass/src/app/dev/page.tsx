'use client';

import SystemsViewer from "@/components/SystemsViewer";
import Dashboard from "@/components/Dashboard";
import { Sidebar } from "lucide-react";
import EditableField from "@/components/EditableText";
import Question from "@/components/QuestionComp/Question";

export default function DevPage() {
  return <Question questionData={{
    "Question": "What structure is indicated by the arrow in this chest X-ray?",
    "Answers": {
      "A": "Aortic arch",
      "B": "Left ventricle",
      "C": "Pulmonary artery",
      "D": "Right atrium"
    },
    "correct_option": "A",
    "Image_URL": "https://medical.uworld.com/wp-content/uploads/2024/12/MED_USMLE-Step-1_Carousel_01.webp",
    "Image_Description": "Chest X-ray with arrow pointing to aortic arch",
    "Explanation": "The arrow points to the aortic arch, which appears as a prominent curved structure in the upper left mediastinum on chest X-ray.",
    "Image_Dependent": true,
    "domain": "Social Sciences: Communication and Interpersonal Skills"
  }} />;
}