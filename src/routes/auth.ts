import {
  confirmEmail,
  getToken,
  recover,
  resetPassword,
  signIn,
  signUp,
} from "@/controllers/auth";
import validateResource from "@/middlewares/validateResource";
import {
  recoverSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/schemas/auth";
import express, { type Router } from "express";

const router: Router = express.Router();
function authRouter(): Router {
  router.get("/auth/confirm-email", confirmEmail);
  router.get("/auth/session", getToken);

  router.post("/auth/signin", validateResource(signInSchema), signIn);
  router.post("/auth/signup", validateResource(signUpSchema), signUp);
  router.post("/auth/recover", validateResource(recoverSchema), recover);
  router.post(
    "/auth/reset-password",
    validateResource(resetPasswordSchema),
    resetPassword
  );

  return router;
}

export default authRouter();
