/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin from "../admin.js";
import type * as comments from "../comments.js";
import type * as customQuestions from "../customQuestions.js";
import type * as http from "../http.js";
import type * as interviews from "../interviews.js";
import type * as liveCode from "../liveCode.js";
import type * as mockInterviews from "../mockInterviews.js";
import type * as resumes from "../resumes.js";
import type * as users from "../users.js";
import type * as userSkillsProfile from "../userSkillsProfile.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  comments: typeof comments;
  customQuestions: typeof customQuestions;
  http: typeof http;
  interviews: typeof interviews;
  liveCode: typeof liveCode;
  mockInterviews: typeof mockInterviews;
  resumes: typeof resumes;
  users: typeof users;
  userSkillsProfile: typeof userSkillsProfile;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
