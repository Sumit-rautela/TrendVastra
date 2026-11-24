import "dotenv/config";
import app from "./app.js";
import connectToDB from "./db/connectToDB.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectToDB();

  app.listen(PORT, () => {
    console.log(`Listing on PORT : ${PORT}`);
  });
};

startServer();
