import { db } from "../name";
import createAnswerCollection from "./answer.collection";
import createCommentCollection from "./comment.collection";

import { databases } from "./config";
import createQuestionCollection from "./question.collection";
import createVoteCollection from "./vote.collection";

export default async function getOrCreateDB() {
  try {
    await databases.get(db);
    console.log("Database connected");
  } catch (error) {
    try {
      await databases.create(db, db);
      console.log("Databae created");
      await Promise.all([
        createQuestionCollection(),
        createAnswerCollection(),
        createCommentCollection(),
        createVoteCollection(),
      ]);
      console.log("Collection Created");
      console.log("Database connected");
    } catch (error) {
      console.log("Error i Createing Database and Collection", error);
    }
  }

  return databases;
}
