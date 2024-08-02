import Link from "next/link";
import { databases, users } from "@/models/server/config";
import {
  answerCollection,
  db,
  voteCollection,
  questionCollection,
} from "@/models/name";
import { Query } from "node-appwrite";
import QuestionCard from "@/components/QuestionCard";
import { UserPrefs } from "@/store/Auth";
import ShimmerButton from "@/components/magicui/shimmer-button";
import slugify from "@/utils/slugify"; // Make sure you have this utility function

export default async function Home() {
  const queries = [
    Query.orderDesc("$createdAt"),
    Query.limit(15), // Limit to 10 questions for the home page
  ];

  const questions = await databases.listDocuments(
    db,
    questionCollection,
    queries
  );

  questions.documents = await Promise.all(
    questions.documents.map(async (ques) => {
      const [author, answers, votes] = await Promise.all([
        users.get<UserPrefs>(ques.authorId),
        databases.listDocuments(db, answerCollection, [
          Query.equal("questionId", ques.$id),
          Query.limit(1),
        ]),
        databases.listDocuments(db, voteCollection, [
          Query.equal("type", "question"),
          Query.equal("typeId", ques.$id),
          Query.limit(1),
        ]),
      ]);

      return {
        ...ques,
        totalAnswers: answers.total,
        totalVotes: votes.total,
        author: {
          $id: author.$id,
          reputation: author.prefs.reputation,
          name: author.name,
        },
      };
    })
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-4">Welcome to Our Q&A Platform</h1>
        <Link href="/questions/ask">
          <ShimmerButton className="shadow-2xl">
            <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
              Ask a question
            </span>
          </ShimmerButton>
        </Link>
      </div>

      <div className="my-12 w-full max-w-5xl">
        <h2 className="text-2xl font-semibold mb-6">Recent Questions</h2>
        <div className="space-y-6">
          {questions.documents.map((ques) => (
            <Link
              key={ques.$id}
              href={`/questions/${ques.$id}/${slugify(ques.title)}`}
              className="block  transition duration-200 rounded-lg"
            >
              <QuestionCard ques={ques} />
            </Link>
          ))}
        </div>
        <Link
          href="/questions"
          className="mt-8 inline-block text-blue-500 hover:underline"
        >
          View all questions
        </Link>
      </div>

      <footer className="mt-auto text-center text-sm text-gray-500">
        © 2024 Our Q&A Platform. All rights reserved.
      </footer>
    </main>
  );
}
