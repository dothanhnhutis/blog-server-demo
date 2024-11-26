import { v4 as uuidv4 } from "uuid";
import { UAParser } from "ua-parser-js";

import { redisClient } from "@/redis/connection";
import { CookieOptions } from "express";
import env from "@/configs/env";
// import { MFASetup } from "./user.cache";
import { randId } from "@/utils/helper";

// sid:userId:sessionId  =>
export type SessionData = {
  id: string;
  userId: string;
  cookie: CookieOptions;
  reqInfo: {
    ip: string;
    userAgent: UAParser.IResult;
    userAgentRaw: string;
    lastAccess: Date;
    createAt: Date;
  };
};

type WriteSessionCache = {
  userId: string;
  reqInfo: {
    ip: string;
    userAgentRaw: string;
  };
  cookie?: CookieOptions;
};

export async function writeSessionCache(input: WriteSessionCache) {
  const sessionId = await randId();
  const now = new Date();
  const cookieOpt = {
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV == "production",
    expires: new Date(now.getTime() + parseInt(env.SESSION_MAX_AGE)),
    ...input.cookie,
  };
  const sessionData: SessionData = {
    id: sessionId,
    userId: input.userId,
    cookie: cookieOpt,
    reqInfo: {
      ...input.reqInfo,
      userAgent: UAParser(input.reqInfo.userAgentRaw),
      lastAccess: now,
      createAt: now,
    },
  };
  const key = `${env.SESSION_KEY_NAME}:${input.userId}:${sessionId}`;
  try {
    await redisClient.set(
      key,
      JSON.stringify(sessionData),
      "PX",
      cookieOpt.expires.getTime() - Date.now()
    );

    return {
      key,
      data: sessionData,
    };
  } catch (error: unknown) {
    console.log(`writeSessionCache() method error: `, error);
  }
}

export async function readSessionCacheByKey(key: string) {
  try {
    const session = await redisClient.get(key);
    if (!session) return;
    return JSON.parse(session) as SessionData;
  } catch (error: unknown) {
    console.log(`readSessionCacheByKey() method error: `, error);
  }
}

export async function refreshSessionCache(key: string) {
  try {
    const session = await redisClient.get(key);
    if (!session) return;
    const sessionData: SessionData = JSON.parse(session);
    const now = Date.now();
    const expires: Date = new Date(now + parseInt(env.SESSION_MAX_AGE));
    sessionData.reqInfo.lastAccess = new Date(now);
    sessionData.cookie.expires = expires;
    await redisClient.set(
      key,
      JSON.stringify(sessionData),
      "PX",
      expires.getTime() - Date.now()
    );

    return sessionData;
  } catch (error: unknown) {
    console.log(`refreshSessionCache() method error: `, error);
  }
}

// export type CreateSession = {
//   userId: string;
//   reqIp?: string;
//   userAgent?: string;
// };
// const SESSION_MAX_AGE = 30 * 24 * 60 * 60000;

// type MFASession = {
//   userId: string;
//   secretKey: string;
//   backupCodes: string[];
//   backupCodesUsed: string[];
// };

// export async function insertMFASession(data: MFASession) {
//   try {
//     const sessionId = uuidv4();
//     const expires = new Date(Date.now() + 30 * 60 * 1000);
//     await redisClient.set(
//       `${env.SESSION_KEY_NAME}:mfa:${sessionId}`,
//       JSON.stringify(data),
//       "EX",
//       expires.getTime() - Date.now()
//     );
//     return { sessionId, expires };
//   } catch (error: unknown) {
//     console.log(`insertMFASession() method error: `, error);
//   }
// }

// export async function readMFASession(mfaSessionId: string) {
//   try {
//     const mfaData = await redisClient.get(
//       `${env.SESSION_KEY_NAME}:mfa:${mfaSessionId}`
//     );
//     if (!mfaData) return;

//     return JSON.parse(mfaData) as MFASession;
//   } catch (error: unknown) {
//     console.log(`readMFASession() method error: `, error);
//   }
// }

// export async function removeMFASession(mfaSessionId: string) {
//   try {
//     await redisClient.del(`${env.SESSION_KEY_NAME}:mfa:${mfaSessionId}`);
//   } catch (error: unknown) {
//     console.log(`removeMFASession() method error: `, error);
//   }
// }

// export async function insertSession(input: CreateSession) {
//   try {
//     const sessionId = uuidv4();
//     const sessionKey = `${env.SESSION_KEY_NAME}:${input.userId}:${sessionId}`;
//     const now = new Date();
//     const cookieOpt = {
//       path: "/",
//       httpOnly: true,
//       secure: false,
//       expires: new Date(now.getTime() + SESSION_MAX_AGE),
//     };

//     const sessionData: SessionData = {
//       id: sessionId,
//       userId: input.userId,
//       cookie: cookieOpt,
//       reqInfo: {
//         ip: input.reqIp || "",
//         userAgent: UAParser(input.userAgent),
//         lastAccess: now,
//         createAt: now,
//       },
//     };

//     await redisClient.set(
//       sessionKey,
//       JSON.stringify(sessionData),
//       "PX",
//       Math.abs(cookieOpt.expires.getTime() - Date.now())
//     );

//     return { sessionKey, cookieOpt };
//   } catch (error: unknown) {
//     console.log(`insertSession() method error: `, error);
//   }
// }

// export async function readSessionByKey(sessionKey: string) {
//   try {
//     const sessionCache = await redisClient.get(sessionKey);
//     if (!sessionCache) return;
//     const sessionData = JSON.parse(sessionCache) as SessionData;
//     return sessionData;
//   } catch (error: any) {
//     console.log(`readSessionByKey() method error: `, error);
//   }
// }

// export async function readAllSession(userId: string) {
//   try {
//     const keys = await redisClient.keys(`${env.SESSION_KEY_NAME}:${userId}:*`);
//     const data: SessionData[] = [];
//     for (const id of keys) {
//       const session = await readSessionByKey(id);
//       if (!session) continue;
//       data.push(session);
//     }
//     return data;
//   } catch (error: unknown) {
//     console.log(`readAllSession() method error: `, error);
//     return [];
//   }
// }

// export async function sessionLastAccess(sessionKey: string) {
//   const sessionCache = await redisClient.get(sessionKey);

//   if (sessionCache == null) return;
//   try {
//     const sessionData = JSON.parse(sessionCache) as SessionData;
//     const now = new Date();

//     sessionData.reqInfo.lastAccess = now;
//     sessionData.cookie.expires = new Date(now.getTime() + SESSION_MAX_AGE);
//     await redisClient.set(
//       sessionKey,
//       JSON.stringify(sessionData),
//       "PX",
//       Math.abs(sessionData.cookie.expires.getTime() - Date.now())
//     );

//     return sessionData;
//   } catch (error: any) {
//     console.log(`SessionLastAccess() method error: `, error);
//   }
// }

// export async function removeSessionByKey(sessionKey: string) {
//   try {
//     await redisClient.del(sessionKey);
//   } catch (error) {
//     console.log(`removeSessionByKey() method error: `, error);
//   }
// }

// export async function removeSessions(
//   userId: string,
//   exceptSessionId?: string[]
// ) {
//   try {
//     const keys = await redisClient.keys(`${env.SESSION_KEY_NAME}:${userId}:*`);
//     if (!exceptSessionId) {
//       await Promise.all(keys.map(async (key) => redisClient.del(key)));
//     } else {
//       const safeSession = exceptSessionId.map(
//         (id) => `${env.SESSION_KEY_NAME}:${userId}:${id}`
//       );
//       await Promise.all(
//         keys
//           .filter((keys) => !exceptSessionId.includes(keys))
//           .map(async (key) => redisClient.del(key))
//       );
//     }
//   } catch (error) {
//     console.log(`removeSessions() method error: `, error);
//   }
// }
