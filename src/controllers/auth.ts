import env from "@/configs/env";
import { BadRequestError, NotFoundError } from "@/error-handler";
import { sendEmailProducer } from "@/rabbitmq/mail";
import { writeSessionCache } from "@/redis/session.cache";
import {
  readUserCacheByEmail,
  readUserTokenCache,
  removeUserTokenCache,
  writeUserCache,
  writeUserTokenCache,
} from "@/redis/user.cache";
import {
  RecoverReq,
  ResetPasswordReq,
  SignInReq,
  SignUpReq,
} from "@/schemas/auth";
import { UserToken } from "@/schemas/user";
import {
  editUserById,
  readUserByEmail,
  readUserByToken,
  writeUserWithPassword,
} from "@/services/user";
import {
  compareData,
  encrypt,
  hashData,
  randId,
  signJWT,
  verifyJWT,
} from "@/utils/helper";
import { emaiEnum } from "@/utils/nodemailer";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function signUp(
  req: Request<{}, {}, SignUpReq["body"]>,
  res: Response
) {
  const { email, password, username } = req.body;
  const user =
    (await readUserCacheByEmail(email)) || (await readUserByEmail(email));
  if (user) throw new BadRequestError("Email đã được đăng ký.");

  const session = await randId();
  const expires: number = Math.floor((Date.now() + 4 * 60 * 60 * 1000) / 1000);
  const newUser = await writeUserWithPassword({
    email,
    password: await hashData(password),
    username,
    emailVerificationToken: session,
    emailVerificationExpires: new Date(expires * 1000),
  });

  const token = signJWT(
    {
      type: "emailVerification",
      session: session,
      exp: expires,
    },
    env.JWT_SECRET
  );

  await Promise.all([
    writeUserCache(newUser),
    writeUserTokenCache({
      type: "emailVerification",
      userId: newUser.id,
      expires: new Date(expires * 1000),
      session,
    }),
    sendEmailProducer({
      template: emaiEnum.VERIFY_EMAIL,
      receiver: email,
      locals: {
        username: username,
        verificationLink: env.CLIENT_URL + "/confirm-email?token=" + token,
      },
    }),
  ]);

  return res.status(StatusCodes.CREATED).send({
    message:
      "Đăng ký thành công. Một email xác nhận sẽ được gửi đến địa chỉ email của bạn. Làm theo hướng dẫn trong email để xác minh tài khoản.",
  });
}

export async function signIn(
  req: Request<{}, {}, SignInReq["body"]>,
  res: Response
) {
  const { email, password } = req.body;
  const user = await readUserByEmail(email);

  if (!user || !user.password || !(await compareData(user.password, password)))
    throw new BadRequestError("Email và mật khẩu không hợp lệ.");

  if (user.status == "SUSPENDED")
    throw new BadRequestError(
      "Tài khoản của bạn đã tạm vô hiệu hoá. Vui lòng kích hoạt lại trước khi đăng nhập"
    );

  if (user.status == "DISABLED")
    throw new BadRequestError("Tài khoản của bạn đã vô hiệu hoá vĩnh viễn");

  const newSession = await writeSessionCache({
    userId: user.id,
    reqInfo: {
      ip: req.ip || "",
      userAgentRaw: req.headers["user-agent"] || "",
    },
  });

  if (!newSession) throw new BadRequestError("Email và mật khẩu không hợp lệ.");
  return res
    .status(StatusCodes.OK)
    .cookie(env.SESSION_KEY_NAME, encrypt(newSession.key), {
      ...newSession?.data.cookie,
    })
    .json({
      message: "Đăng nhập thành công",
    });
}

export async function recover(
  req: Request<{}, {}, RecoverReq["body"]>,
  res: Response
) {
  const { email } = req.body;
  const user =
    (await readUserCacheByEmail(email)) || (await readUserByEmail(email));
  if (!user) throw new BadRequestError("Email không tồn tại");

  const session = await randId();
  const expires: number = Math.floor((Date.now() + 4 * 60 * 60 * 1000) / 1000);

  const token = signJWT(
    {
      type: "recover",
      session: session,
      exp: expires,
    },
    env.JWT_SECRET
  );
  const recoverLink = `${env.CLIENT_URL}/reset-password?token=${token}`;

  await Promise.all([
    editUserById(user.id, {
      passwordResetToken: session,
      passwordResetExpires: new Date(expires * 1000),
    }),
    writeUserTokenCache({
      type: "recover",
      session,
      userId: user.id,
      expires: new Date(expires * 1000),
    }),
    sendEmailProducer({
      template: emaiEnum.RECOVER_ACCOUNT,
      receiver: user.email,
      locals: {
        username: user.username,
        recoverLink,
      },
    }),
  ]);

  return res.status(StatusCodes.OK).send({
    message: "Email đổi mật khẩu đã được gửi",
  });
}

export async function confirmEmail(
  req: Request<{}, {}, {}, { token?: string | string[] | undefined }>,
  res: Response
) {
  const { token } = req.query;
  if (Array.isArray(token) || typeof token != "string")
    throw new NotFoundError();
  const tokenVerify = verifyJWT<UserToken>(token, env.JWT_SECRET);
  if (!tokenVerify || tokenVerify.type != "emailVerification")
    throw new BadRequestError("Phiên của bạn đã hết hạn.");

  const user =
    (await readUserTokenCache(tokenVerify)) ||
    (await readUserByToken(tokenVerify));
  if (!user) throw new BadRequestError("Phiên của bạn đã hết hạn.");

  await Promise.all([
    editUserById(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: new Date(),
    }),
    removeUserTokenCache(tokenVerify),
  ]);
  return res.status(StatusCodes.OK).json({
    message: "Xác thực tài khoản thành công",
  });
}

export async function resetPassword(
  req: Request<{}, {}, ResetPasswordReq["body"], ResetPasswordReq["query"]>,
  res: Response
) {
  const { token } = req.query;
  if (typeof token != "string") throw new NotFoundError();

  const tokenVerify = verifyJWT<UserToken>(token, env.JWT_SECRET);

  if (!tokenVerify || tokenVerify.type != "recover")
    throw new BadRequestError("Phiên của bạn đã hết hạn.");

  const { newPassword } = req.body;

  const user = await readUserByToken(tokenVerify);
  if (!user) throw new BadRequestError("Phiên của bạn đã hết hạn.");

  await Promise.all([
    editUserById(user.id, {
      password: await hashData(newPassword),
      passwordResetExpires: new Date(),
      passwordResetToken: null,
    }),
    removeUserTokenCache(tokenVerify),
  ]);

  return res.status(StatusCodes.OK).send({
    message: "Đặt lại mật khẩu thành công",
  });
}

export async function getToken(
  req: Request<{}, {}, {}, Partial<{ token: string | string[] | undefined }>>,
  res: Response
) {
  const { token } = req.query;
  if (Array.isArray(token) || typeof token == "undefined")
    throw new NotFoundError();
  const tokenVerify = verifyJWT<UserToken>(token, env.JWT_SECRET);
  if (!tokenVerify) throw new BadRequestError("Phiên của bạn đã hết hạn.");

  const user =
    (await readUserTokenCache(tokenVerify)) ||
    (await readUserByToken(tokenVerify));
  if (!user) throw new BadRequestError("Phiên của bạn đã hết hạn.");

  return res.status(StatusCodes.OK).send(user);
}
