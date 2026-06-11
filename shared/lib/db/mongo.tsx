// shared/lib/db/mongo.tsx

// This is for database connection using mongodb

import * as mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

export const mongoDB = () => {
  mongoose
    .connect(
      // Need to change this for future connections
      MONGODB_URI,
      {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000, // 45 seconds
      },
    )
    .then(() => {
      console.log("Farmers Republic DB Connected");
      //console.log(DB);
    })
    .catch((err: any) => {
      console.log("Error while connecting Farmers Republic  DB \n", err);
    });
};