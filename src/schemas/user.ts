import { SYSTEM_PERMISSIONS } from "@/configs/permission";
import * as z from "zod";

export const sendOTPChangeEmailSchema = z.object({
  body: z
    .object({
      newEmail: z
        .string({
          required_error: "newEmail là trường bắt buộc",
          invalid_type_error: "newEmail phải là chuỗi",
        })
        .email("newEmail không hợp lệ"),
    })
    .strict(),
});

export const changeEmailByOTPSchema = z.object({
  body: sendOTPChangeEmailSchema.shape.body
    .extend({
      otp: z
        .string({
          required_error: "Mã xác thực là trường bắt buộc",
          invalid_type_error: "Mã xác thực phải là chuỗi",
        })
        .length(6, "Mã xác thực không hợp lệ"),
    })
    .strict(),
});

export const replaceEmailSchema = z.object({
  body: z.object({
    newEmail: z
      .string({
        required_error: "newEmail là trường bắt buộc",
        invalid_type_error: "newEmail phải là chuỗi",
      })
      .email("newEmail không hợp lệ"),
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      oldPassword: z
        .string({
          invalid_type_error: "Mật khẩu cũ phải là chuỗi",
        })
        .optional(),
      isSignOut: z.enum(["ALL", "NONE", "EXCEPT_CURRENT"]).default("NONE"),
      newPassword: z
        .string({
          required_error: "Mật khẩu mới là trường bắt buộc",
          invalid_type_error: "Mật khẩu mới phải là chuỗi",
        })
        .min(8, "Mật khẩu mới quá ngắn")
        .max(40, "Mật khẩu mới quá dài")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]*$/,
          "Mật khẩu mới phải có ký tự hoa, thường, sô và ký tự đặc biệt"
        ),
      confirmNewPassword: z.string(),
    })
    .strict()
    .refine(
      (data) => !data.oldPassword || data.oldPassword !== data.newPassword,
      {
        message: "Mật khẩu mới phải khác với mật khẩu cũ",
        path: ["newPassword"],
      }
    )
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "Xác nhận mật khẩu không khớp",
      path: ["confirmNewPassword"],
    }),
});

export const setupMFASchema = z.object({
  body: z
    .object({
      deviceName: z
        .string({
          invalid_type_error: "Tên thiết ghi nhớ phải là chuỗi",
          required_error: "Tên thiết ghi nhớ phải bắt buộc",
        })
        .max(128, "Tên thiết ghi nhớ tối đa 128 ký tự")
        .regex(
          /^[\d\w+=,.@\-_][\d\w\s+=,.@\-_]*$/,
          "Tên thiết ghi nhớ không được chứa các ký tự đăc biệt ngoài ký tự này '=,.@-_'"
        ),
    })
    .strict(),
});

export const enableMFASchema = z.object({
  body: z
    .object({
      mfa_code1: z
        .string({
          invalid_type_error: "Xác thực đa yếu tố (MFA) 1 là chuỗi",
          required_error: "Xác thực đa yếu tố (MFA) 1 phải bắt buộc",
        })
        .length(6, "Xác thực đa yếu tố (MFA) 1 không hợp lệ"),
      mfa_code2: z
        .string({
          invalid_type_error: "Xác thực đa yếu tố (MFA) 2 là chuỗi",
          required_error: "Xác thực đa yếu tố (MFA) 2 phải bắt buộc",
        })
        .length(6, "Xác thực đa yếu tố (MFA) 2 không hợp lệ"),
    })
    .strict(),
});

export const createUserSchema = z.object({
  body: z
    .object({
      username: z.string({
        required_error: "username là trường bắt buộc",
        invalid_type_error: "username phải là chuỗi",
      }),
      email: z
        .string({
          required_error: "Email là trường bắt buộc",
          invalid_type_error: "Email phải là chuỗi",
        })
        .email("Email không hợp lệ"),
      password: z
        .string({
          required_error: "Mật khẩu là bắt buộc",
          invalid_type_error: "Mật khẩu phải là chuỗi",
        })
        .min(8, "Mật khẩu quá ngắn")
        .max(40, "Mật khẩu quá dài")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]*$/,
          "Mật khẩu phải có ký tự hoa, thường, sô và ký tự đặc biệt"
        ),
      confirmPassword: z.string({
        required_error: "Xác nhận mật khẩu là bắt buộc",
        invalid_type_error: "Xác nhận mật khẩu phải là chuỗi",
      }),
      roles: z
        .array(
          z.union(
            [
              z.string({
                invalid_type_error:
                  "vai trò phải là string hoặc { name: string; permissions: SYSTEM_PERMISSIONS[] }",
              }),
              z
                .object(
                  {
                    name: z.string({
                      required_error: "name là bắt buộc",
                      invalid_type_error: "name phải là chuỗi",
                    }),
                    permissions: z.array(z.enum(SYSTEM_PERMISSIONS), {
                      invalid_type_error:
                        "vai trò phải là string hoặc { name: string; permissions: SYSTEM_PERMISSIONS[] }",
                      required_error:
                        "vai trò phải là string hoặc { name: string; permissions: SYSTEM_PERMISSIONS[] }",
                    }),
                  },
                  {
                    invalid_type_error:
                      "vai trò phải là string hoặc { name: string; permissions: SYSTEM_PERMISSIONS[] }",
                    required_error:
                      "vai trò phải là string hoặc { name: string; permissions: SYSTEM_PERMISSIONS[] }",
                  }
                )
                .strict(),
            ],
            {
              errorMap: (e) => {
                if (e.code === z.ZodIssueCode.invalid_union) {
                  const reverted = [
                    ...[...e.unionErrors].reverse()[0].issues,
                  ].reverse()[0];
                  reverted.path.shift();
                  return {
                    message:
                      `${reverted.message}. Hint: Error at ${reverted.path
                        .map((p) => (typeof p === "number" ? `[${p}]` : p))
                        .join(".")}` ||
                      `vai trò phải là string hoặc { name: string; permissions: SYSTEM_PERMISSIONS[] }`,
                  };
                } else {
                  return {
                    message:
                      "vai trò phải là string hoặc { name: string; permissions: SYSTEM_PERMISSIONS[] }",
                  };
                }
              },
            }
          ),
          {
            invalid_type_error:
              "vai trò phải là string hoặc { name: string; permissions: SYSTEM_PERMISSIONS[] }",
          }
        )
        .optional(),
    })
    .strict()
    .refine((data) => data.confirmPassword == data.password, {
      message: "Xác nhận mật khẩu không khớp",
      path: ["confirmPassword"],
    }),
});

export type SendOTPChangeEmailReq = z.infer<typeof sendOTPChangeEmailSchema>;
export type ChangeEmailByOTPReq = z.infer<typeof changeEmailByOTPSchema>;
export type ChangePasswordReq = z.infer<typeof changePasswordSchema>;
export type SetupMFAReq = z.infer<typeof setupMFASchema>;
export type EnableMFAReq = z.infer<typeof enableMFASchema>;
export type CreateUserReq = z.infer<typeof createUserSchema>;

type Role = "SUPER_ADMIN" | "ADMIN" | "BUSINESS_PARTNER" | "CUSTOMER";
type UserStatus = "ACTIVE" | "SUSPENDED" | "DISABLED";
type UserGender = "MALE" | "FEMALE" | "OTHER" | null;
type UserMFA = {
  secretKey: string;
  lastAccess: Date;
  backupCodes: string[];
  backupCodesUsed: string[];
  createdAt: Date;
  updatedAt: Date;
};

type OauthProvider = {
  provider: string;
  providerId: string;
};

export type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  // emailVerificationToken: string | null;
  // emailVerificationExpires: Date | null;
  // roles: {
  //   role: {
  //     id: string;
  //     name: string;
  //     readOnly: boolean;
  //     permissions: string[];
  //     createdAt: Date;
  //     updatedAt: Date;
  //   };
  // }[];
  // usersToPlanRoles: {
  //   planRole: {
  //     id: string;
  //     planRoleName: string;
  //     planPermissions: string[];
  //     plan: {
  //       id: string;
  //       name: string;
  //     };
  //   };
  // }[];
  status: UserStatus;
  password: string | null;
  // passwordResetToken: string | null;
  // passwordResetExpires: Date | null;
  // reActiveExpires: Date | null;
  // reActiveToken: string | null;
  username: string;
  birthDate: Date | null;
  gender: UserGender;
  picture: string | null;
  phoneNumber: string | null;
  mfa: UserMFA | null;
  oauthProviders: OauthProvider[];
  createdAt: Date;
  updatedAt: Date;
};

export type UserToken = {
  type: "emailVerification" | "recover" | "reActivate";
  session: string;
};
