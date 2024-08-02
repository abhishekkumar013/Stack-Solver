import {
  answerCollection,
  db,
  questionCollection,
  voteCollection,
} from "@/models/name";
import { databases, users } from "@/models/server/config";
import { UserPrefs } from "@/store/Auth";
import { NextRequest, NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";

export async function POST(request: NextRequest) {
  try {
    const { votedById, voteStatus, type, typeId } = await request.json();
    const response = await databases.listDocuments(db, voteCollection, [
      Query.equal("type", type),
      Query.equal("typeId", typeId),
      Query.equal("votedById", votedById),
    ]);
    if (response.documents.length > 0) {
      await databases.deleteDocument(
        db,
        voteCollection,
        response.documents[0].$id
      );

      // decrease reputation
      const QuestionOrAns = await databases.getDocument(
        db,
        type === "question" ? questionCollection : answerCollection,
        typeId
      );
      const authorPref = await users.getPrefs<UserPrefs>(
        QuestionOrAns.authorId
      );

      await users.updatePrefs<UserPrefs>(QuestionOrAns.authorId, {
        reputation:
          response.documents[0].voteStatus === "upvoted"
            ? Number(authorPref.reputation) - 1
            : Number(authorPref.reputation) + 1,
      });
    }

    // prev votes does not exists or vote status changes
    if (response.documents[0]?.voteStatus !== voteStatus) {
      const doc = await databases.createDocument(
        db,
        voteCollection,
        ID.unique(),
        {
          type,
          typeId,
          voteStatus,
          votedById,
        }
      );

      // ?increa or decrease reputation
      const QuestionOrAns = await databases.getDocument(
        db,
        type === "question" ? questionCollection : answerCollection,
        typeId
      );
      const authorPref = await users.getPrefs<UserPrefs>(
        QuestionOrAns.authorId
      );

      //  if vote was present
      if (response.documents[0]) {
        await users.updatePrefs<UserPrefs>(QuestionOrAns.authorId, {
          reputation:
            response.documents[0].voteStatus === "upvoted"
              ? Number(authorPref.reputation) - 1
              : Number(authorPref.reputation) + 1,
        });
      }
    }

    const [upvotes, downvotes] = await Promise.all([
      databases.listDocuments(db, voteCollection, [
        Query.equal("type", type),
        Query.equal("typeId", typeId),
        Query.equal("voteStatus", "upvoted"),
        Query.equal("votedById", votedById),
        Query.limit(1),
      ]),
      databases.listDocuments(db, voteCollection, [
        Query.equal("type", type),
        Query.equal("typeId", typeId),
        Query.equal("voteStatus", "downvotes"),
        Query.equal("votedById", votedById),
        Query.limit(1),
      ]),
    ]);

    return NextResponse.json(
      {
        data: {
          document: null,
          voteResult: upvotes.total - downvotes.total,
        },
        message: "Vote Withdrawn",
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Error in Voting" },
      { status: error?.status || error?.code || 500 }
    );
  }
}
