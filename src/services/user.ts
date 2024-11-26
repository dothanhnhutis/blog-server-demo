import { SignInReq, SignUpReq } from "@/schemas/auth";
import prisma from "./db";
import { User, UserToken } from "@/schemas/user";
import { Prisma } from "@prisma/client";
import { hashData, randId } from "@/utils/helper";

const userSelectDefault = {
  id: true,
  email: true,
  emailVerified: true,
  // emailVerificationToken: true,
  // emailVerificationExpires: true,
  //   roles: {
  //     select: {
  //       role: {
  //         select: {
  //           id: true,
  //           name: true,
  //           readOnly: true,
  //           permissions: true,
  //           createdAt: true,
  //           updatedAt: true,
  //         },
  //       },
  //     },
  //   },
  //   usersToPlanRoles: {
  //     select: {
  //       planRole: {
  //         select: {
  //           id: true,
  //           planRoleName: true,
  //           planPermissions: true,
  //           plan: {
  //             select: {
  //               id: true,
  //               name: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  status: true,
  password: true,
  // passwordResetToken: true,
  // passwordResetExpires: true,
  // reActiveExpires: true,
  // reActiveToken: true,
  username: true,
  gender: true,
  picture: true,
  phoneNumber: true,
  birthDate: true,
  mfa: {
    select: {
      backupCodes: true,
      backupCodesUsed: true,
      lastAccess: true,
      secretKey: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  oauthProviders: {
    select: {
      providerId: true,
      provider: true,
    },
  },
  createdAt: true,
  updatedAt: true,
};

export async function readUserByEmail(email: string) {
  const user = await prisma.users.findUnique({
    where: {
      email,
    },
    select: userSelectDefault,
  });
  if (!user) return;
  return user;
}
export async function readUserById(id: string) {
  const user = await prisma.users.findUnique({
    where: {
      id,
    },
    select: userSelectDefault,
  });
  if (!user) return;
  return user;
}

export async function readUserByToken(token: UserToken) {
  let user: User | null = null;
  switch (token.type) {
    case "emailVerification":
      user = await prisma.users.findUnique({
        where: {
          emailVerificationToken: token.session,
          emailVerificationExpires: { gte: new Date() },
        },
        select: userSelectDefault,
      });
      break;

    case "recover":
      user = await prisma.users.findUnique({
        where: {
          passwordResetToken: token.session,
          emailVerificationExpires: { gte: new Date() },
        },
        select: userSelectDefault,
      });
      break;

    case "reActivate":
      user = await prisma.users.findUnique({
        where: {
          reActiveToken: token.session,
          emailVerificationExpires: { gte: new Date() },
        },
        select: userSelectDefault,
      });
      break;
  }

  if (!user) return;
  return user;
}

type WriteUserWithPassword = {
  username: string;
  email: string;
  password: string;
  emailVerificationExpires: Date;
  emailVerificationToken: string;
  status?: User["status"];
  gender?: User["gender"];
  picture?: string;
  phoneNumber?: string;
  birthDate?: string;
};

export async function writeUserWithPassword(input: WriteUserWithPassword) {
  const data: Prisma.UsersCreateInput = {
    ...input,
  };

  const user = await prisma.users.create({
    data,
    select: userSelectDefault,
  });

  return user;
}

type EditUser = {
  password: string;
  emailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  reActiveExpires: Date | null;
  reActiveToken: string | null;
};

export async function editUserById(userId: string, input: Partial<EditUser>) {
  const data: Prisma.UsersUpdateInput = {
    ...input,
  };
  const user = await prisma.users.update({
    where: { id: userId },
    data,
    select: userSelectDefault,
  });

  return user;
}
