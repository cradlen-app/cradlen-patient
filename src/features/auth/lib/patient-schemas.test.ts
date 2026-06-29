import { describe, expect, it } from "vitest";
import { createPatientSignInSchema } from "./patient-sign-in.schemas";
import { createPatientSignUpSchema } from "./patient-sign-up.schemas";
import {
  createForgotPasswordCompleteSchema,
  createForgotPasswordStartSchema,
} from "./patient-forgot-password.schemas";

/**
 * Identity translator: returns the i18n key verbatim so assertions can check
 * which validation message fired without needing a message catalog.
 */
const t = ((key: string) => key) as never;

const signIn = createPatientSignInSchema(t);
const signUp = createPatientSignUpSchema(t);
const fpStart = createForgotPasswordStartSchema(t);
const fpComplete = createForgotPasswordCompleteSchema(t);

/** Collect the issue messages for a failed parse. */
function errorsOf(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : result.error!.issues.map((i) => i.message);
}

const STRONG_PASSWORD = "Abcdef1!";

describe("createPatientSignInSchema", () => {
  it("accepts a valid 14-digit national id + strong password", () => {
    expect(
      signIn.safeParse({ nationalId: "12345678901234", password: STRONG_PASSWORD })
        .success,
    ).toBe(true);
  });

  it("rejects national ids that are not exactly 14 digits", () => {
    for (const nationalId of ["1234567890123", "123456789012345", "abcd5678901234"]) {
      const res = signIn.safeParse({ nationalId, password: STRONG_PASSWORD });
      expect(res.success).toBe(false);
      expect(errorsOf(res)).toContain("errors.nationalIdInvalid");
    }
  });

  it("flags each missing password complexity class", () => {
    const base = "12345678901234";
    expect(errorsOf(signIn.safeParse({ nationalId: base, password: "ABCDEF1!" }))).toContain(
      "errors.passwordLowercase",
    );
    expect(errorsOf(signIn.safeParse({ nationalId: base, password: "abcdef1!" }))).toContain(
      "errors.passwordUppercase",
    );
    expect(errorsOf(signIn.safeParse({ nationalId: base, password: "Abcdefg!" }))).toContain(
      "errors.passwordNumber",
    );
    expect(errorsOf(signIn.safeParse({ nationalId: base, password: "Abcdef12" }))).toContain(
      "errors.passwordSymbol",
    );
    expect(errorsOf(signIn.safeParse({ nationalId: base, password: "Ab1!" }))).toContain(
      "errors.passwordMinLength",
    );
  });
});

describe("createPatientSignUpSchema", () => {
  const valid = {
    nationalId: "12345678901234",
    phoneNumber: "01012345678",
    dateOfBirth: "1990-01-01",
    securityQuestion: "BIRTH_CITY",
    securityAnswer: "Cairo",
    password: STRONG_PASSWORD,
    confirmPassword: STRONG_PASSWORD,
  };

  it("accepts a fully valid payload", () => {
    expect(signUp.safeParse(valid).success).toBe(true);
  });

  it("accepts Egyptian mobile numbers with formatting punctuation", () => {
    expect(signUp.safeParse({ ...valid, phoneNumber: "+20 100 123 4567" }).success).toBe(
      true,
    );
    expect(signUp.safeParse({ ...valid, phoneNumber: "(010) 1234-5678" }).success).toBe(
      true,
    );
  });

  it("rejects an invalid phone number", () => {
    expect(errorsOf(signUp.safeParse({ ...valid, phoneNumber: "12345" }))).toContain(
      "errors.invalidPhone",
    );
  });

  it("rejects a future date of birth", () => {
    expect(
      errorsOf(signUp.safeParse({ ...valid, dateOfBirth: "3000-01-01" })),
    ).toContain("errors.dateOfBirthInvalid");
  });

  it("rejects a security question outside the canonical key set", () => {
    expect(
      errorsOf(signUp.safeParse({ ...valid, securityQuestion: "NOT_A_KEY" })),
    ).toContain("errors.securityQuestionRequired");
  });

  it("reports the mismatch on the confirmPassword path", () => {
    const res = signUp.safeParse({ ...valid, confirmPassword: "Different1!" });
    expect(res.success).toBe(false);
    const issue = res.error!.issues.find((i) => i.message === "errors.passwordMismatch");
    expect(issue?.path).toEqual(["confirmPassword"]);
  });
});

describe("forgot-password schemas", () => {
  it("start: validates identity (nationalId + phone + past DOB)", () => {
    expect(
      fpStart.safeParse({
        nationalId: "12345678901234",
        phoneNumber: "01012345678",
        dateOfBirth: "1985-05-05",
      }).success,
    ).toBe(true);
  });

  it("complete: enforces password rules and confirmation match", () => {
    expect(
      fpComplete.safeParse({
        securityAnswer: "Cairo",
        password: STRONG_PASSWORD,
        confirmPassword: STRONG_PASSWORD,
      }).success,
    ).toBe(true);

    const mismatch = fpComplete.safeParse({
      securityAnswer: "Cairo",
      password: STRONG_PASSWORD,
      confirmPassword: "Other1!a",
    });
    expect(errorsOf(mismatch)).toContain("errors.passwordMismatch");
  });

  it("complete: rejects a too-short security answer", () => {
    expect(
      errorsOf(
        fpComplete.safeParse({
          securityAnswer: "a",
          password: STRONG_PASSWORD,
          confirmPassword: STRONG_PASSWORD,
        }),
      ),
    ).toContain("errors.securityAnswerRequired");
  });
});
