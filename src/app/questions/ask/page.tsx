"use client";

import React from "react";
import QuestionForm from "@/components/QuestionForm";

const AskQuestionPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Ask a Question</h1>
      <QuestionForm />
    </div>
  );
};

export default AskQuestionPage;
