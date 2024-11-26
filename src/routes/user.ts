import { currentUser } from "@/controllers/user";
import express, { type Router } from "express";

const router: Router = express.Router();
function userRouter(): Router {
  router.get("/users/me", currentUser);
  return router;
}

export default userRouter();
