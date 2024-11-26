import { Request, Response, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";

export async function currentUser(req: Request, res: Response) {
  const { password, ...noPass } = req.user!;

  return res
    .status(StatusCodes.OK)
    .json({ ...noPass, hasPassword: !!password });
}
