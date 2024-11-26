import { redisClient } from "@/redis/connection";
import { User, UserToken } from "@/schemas/user";
// import { User, UserToken } from "@/schema/user";
// import { generateOTP, hashData } from "@/utils/helper";
// import { generateMFA, TOTPType } from "@/utils/mfa";

export async function readUserCacheByEmail(email: string) {
  try {
    const id = await redisClient.get(`users:email:${email}`);
    if (!id) return;
    const user = await redisClient.get(`users:${id}`);
    if (!user) return;
    return JSON.parse(user) as User;
  } catch (error: unknown) {
    console.log(`readUserCacheByEmail() method error: `, error);
  }
}

export async function readUserCacheById(id: string) {
  try {
    const user = await redisClient.get(`users:${id}`);
    if (!user) return;
    return JSON.parse(user) as User;
  } catch (error: unknown) {
    console.log(`readUserCacheById() method error: `, error);
  }
}

export async function readUserTokenCache(token: UserToken) {
  let userId: string | null = null;
  switch (token.type) {
    case "emailVerification":
      userId = await redisClient.get(
        `users:emailVerification:${token.session}`
      );
      break;
    case "recover":
      userId = await redisClient.get(`users:recover:${token.session}`);
      break;
    case "reActivate":
      userId = await redisClient.get(`users:reActivate:${token.session}`);
      break;
  }

  if (!userId) return;
  const user = await redisClient.get(`users:${userId}`);
  return user ? (JSON.parse(user) as User) : undefined;
}

export async function writeUserCache(user: User) {
  try {
    await redisClient.set(`users:${user.id}`, JSON.stringify(user));
    await redisClient.set(`users:email:${user.email}`, user.id);
  } catch (error: unknown) {
    console.log(`writeUserCacheByKey() method error: `, error);
  }
}

export async function writeUserTokenCache(
  token: UserToken & { userId: string; expires: Date }
) {
  let userId: string | null = null;
  switch (token.type) {
    case "emailVerification":
      userId = await redisClient.set(
        `users:emailVerification:${token.session}`,
        token.userId,
        "PX",
        token.expires.getTime() - Date.now()
      );
      break;
    case "recover":
      userId = await redisClient.set(
        `users:recover:${token.session}`,
        token.userId,
        "PX",
        token.expires.getTime() - Date.now()
      );
      break;
    case "reActivate":
      userId = await redisClient.set(
        `users:reActivate:${token.session}`,
        token.userId,
        "PX",
        token.expires.getTime() - Date.now()
      );
      break;
  }

  if (!userId) return;
  const user = await redisClient.get(`users:${userId}`);
  return user ? (JSON.parse(user) as User) : undefined;
}

export async function removeUserTokenCache(token: UserToken) {
  switch (token.type) {
    case "emailVerification":
      await redisClient.del(`users:emailVerification:${token.session}`);
      break;
    case "recover":
      await redisClient.get(`users:recover:${token.session}`);
      break;
    case "reActivate":
      await redisClient.get(`users:reActivate:${token.session}`);
      break;
  }
}

// export async function readUserCacheByEmail(email: string) {
//   try {
//     const id = await redisClient.get(`user:email:${email}`);
//     if (!id) return;
//     const userCache = await redisClient.get(`user:${id}`);
//     if (!userCache) {
//       await redisClient.del(`user:email:${email}`);
//       return;
//     }
//     return JSON.parse(userCache) as User;
//   } catch (error: unknown) {
//     console.log(`getUserCacheByEmail() method error: `, error);
//     return;
//   }
// }

// export async function readUserCacheById(id: string) {
//   try {
//     const userCache = await redisClient.get(`user:${id}`);
//     if (!userCache) {
//       return;
//     }
//     return JSON.parse(userCache) as User;
//   } catch (error: unknown) {
//     console.log(`getUserCacheById() method error: `, error);
//     return;
//   }
// }

// export async function checkTokenExpires(token: UserToken) {
//   try {
//     const id = await redisClient.get(`user:${token.type}:${token.session}`);
//     return !!id;
//   } catch (error: unknown) {
//     console.log(`checkTokenExpires() method error: `, error);
//     return false;
//   }
// }

// export async function readUserCacheByToken(token: UserToken) {
//   try {
//     const id = await redisClient.get(`user:${token.type}:${token.session}`);
//     if (!id) return;
//     const userCache = await redisClient.get(`user:${id}`);
//     if (!userCache) {
//       await redisClient.del(`user:${token.type}:${token.session}`);
//       return;
//     }
//     return JSON.parse(userCache) as User;
//   } catch (error: unknown) {
//     console.log(`getUserCacheByToken() method error: `, error);
//     return;
//   }
// }

// export async function saveUserCacheByToken(
//   token: UserToken,
//   userId: string,
//   milliseconds: number
// ) {
//   try {
//     await redisClient.set(
//       `user:${token.type}:${token.session}`,
//       userId,
//       "PX",
//       milliseconds
//     );
//   } catch (error: unknown) {
//     console.log(`saveUserCacheByToken() method error: `, error);
//   }
// }

// export async function deleteUserCacheToken(token: UserToken) {
//   try {
//     await redisClient.del(`user:${token.type}:${token.session}`);
//   } catch (error: unknown) {
//     console.log(`deleteUserCacheToken() method error: `, error);
//   }
// }

// export async function saveUserCache(user: User) {
//   try {
//     await redisClient.set(`user:${user.id}`, JSON.stringify(user));
//     await redisClient.set(`user:email:${user.email}`, user.id);
//   } catch (error: unknown) {
//     console.log(`saveUserCache() method error: `, error);
//   }
// }

// export async function saveUserCacheOTP(
//   userId: string,
//   newEmail: string,
//   otp: string
// ) {
//   try {
//     await redisClient.set(
//       `user:change-email:${userId}:${newEmail}`,
//       await hashData(otp),
//       "EX",
//       5 * 60
//     );
//   } catch (error: unknown) {
//     console.log(`saveUserCacheOTP() method error: `, error);
//   }
// }

// export async function getUserCacheOTP(userId: string, newEmail: string) {
//   try {
//     const hash = await redisClient.get(
//       `user:change-email:${userId}:${newEmail}`
//     );
//     if (!hash) return;
//     return hash;
//   } catch (error: unknown) {
//     console.log(`getUserCacheOTP() method error: `, error);
//   }
// }

// export async function deleteUserCacheOTP(
//   userId: string,
//   newEmail: string,
//   oldEmail: string
// ) {
//   try {
//     await Promise.all([
//       redisClient.del(`user:change-email:${userId}:${newEmail}`),
//       redisClient.del(`user:email:${oldEmail}`),
//     ]);
//   } catch (error: unknown) {
//     console.log(`deleteUserCacheOTP() method error: `, error);
//   }
// }

// export type MFASetup = {
//   backupCodes: string[];
//   totp: TOTPType;
// };

// export const generateMFASetup = async (
//   userId: string,
//   deviceName: string
// ): Promise<MFASetup | undefined> => {
//   try {
//     const existMFASetup = await redisClient.get(`user:mfa:${userId}`);
//     if (existMFASetup) {
//       return JSON.parse(existMFASetup) as MFASetup;
//     } else {
//       const backupCodes = Array.from({ length: 10 }).map(() => generateOTP());
//       const totp = generateMFA(deviceName);
//       await redisClient.set(
//         `user:mfa:${userId}`,
//         JSON.stringify({
//           backupCodes,
//           totp,
//         }),
//         "EX",
//         30 * 60
//       );
//       return { backupCodes, totp };
//     }
//   } catch (error: unknown) {
//     console.log(`generateMFASetup() method error: `, error);
//   }
// };

// export const getMFASetup = async (userId: string) => {
//   try {
//     const existMFASetup = await redisClient.get(`user:mfa:${userId}`);
//     if (!existMFASetup) return;
//     return JSON.parse(existMFASetup) as MFASetup;
//   } catch (error) {
//     console.log(`getMFASetup() method error: `, error);
//   }
// };

// export const deleteMFASetup = async (userId: string) => {
//   try {
//     await redisClient.del(`user:mfa:${userId}`);
//   } catch (error) {
//     console.log(`deleteMFASetup() method error: `, error);
//   }
// };
