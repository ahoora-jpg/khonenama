import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const registration = readFileSync("app/api/businesses/register/route.ts", "utf8");
const wizard = readFileSync("components/BusinessOnboardingWizard.tsx", "utf8");
const dashboard = readFileSync("components/BusinessDashboardContent.tsx", "utf8");
const upload = readFileSync("app/api/me/business/media/upload/route.ts", "utf8");

test("quick registration has only the essential creation contract", () => {
  assert.match(wizard, /mode: "quick"/);
  assert.match(wizard, /categories: \[form.category\]/);
  assert.match(wizard, /services: \[form.service\]/);
  assert.doesNotMatch(wizard, /confirmPassword|تکرار رمز|انتخاب پلن/);
  for (const field of ["email", "address", "instagram", "website", "area"]) assert.doesNotMatch(wizard, new RegExp(`update\\("${field}"`));
});

test("server creates a truthful minimum published booth and whole-city coverage", () => {
  assert.match(registration, /quickMode && ownerName\.length < 2\) ownerName = businessName/);
  assert.match(registration, /\["تمام " \+ city\]/);
  assert.match(registration, /خدمت اصلی ثبت‌شده: \$\{selectedServices\[0\]\}/);
  assert.match(registration, /categories\.length && selectedServices\.length \? "published" : "draft"/);
  assert.match(registration, /if \(email &&/);
});

test("completion removes OTP as a blocker and prioritizes first media", () => {
  assert.doesNotMatch(dashboard, /تأیید شماره همراه/);
  assert.match(dashboard, /افزودن اولین عکس/);
  assert.match(wizard, /غرفه شما ساخته شد/);
  assert.match(wizard, /mode="first-photo"/);
});

test("first-media conversion is server-side aggregate-only and can fire once per business", () => {
  assert.match(upload, /Number\(total\?\.count\) === 1/);
  assert.match(upload, /recordConversion\(owned\.db, "first_media_added"\)/);
  assert.doesNotMatch(upload, /phone|email|customerName/);
});
