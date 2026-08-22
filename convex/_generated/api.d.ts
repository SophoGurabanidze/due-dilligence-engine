/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents_ai from "../agents/ai.js";
import type * as agents_analyzer from "../agents/analyzer.js";
import type * as agents_companyAgent from "../agents/companyAgent.js";
import type * as agents_dataroomAgent from "../agents/dataroomAgent.js";
import type * as agents_financialAgent from "../agents/financialAgent.js";
import type * as agents_identityAgent from "../agents/identityAgent.js";
import type * as agents_legalAgent from "../agents/legalAgent.js";
import type * as agents_marketAgent from "../agents/marketAgent.js";
import type * as agents_types from "../agents/types.js";
import type * as agents_webAgent from "../agents/webAgent.js";
import type * as dataRoomFiles from "../dataRoomFiles.js";
import type * as findings from "../findings.js";
import type * as investigations from "../investigations.js";
import type * as orchestrator from "../orchestrator.js";
import type * as reports from "../reports.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "agents/ai": typeof agents_ai;
  "agents/analyzer": typeof agents_analyzer;
  "agents/companyAgent": typeof agents_companyAgent;
  "agents/dataroomAgent": typeof agents_dataroomAgent;
  "agents/financialAgent": typeof agents_financialAgent;
  "agents/identityAgent": typeof agents_identityAgent;
  "agents/legalAgent": typeof agents_legalAgent;
  "agents/marketAgent": typeof agents_marketAgent;
  "agents/types": typeof agents_types;
  "agents/webAgent": typeof agents_webAgent;
  dataRoomFiles: typeof dataRoomFiles;
  findings: typeof findings;
  investigations: typeof investigations;
  orchestrator: typeof orchestrator;
  reports: typeof reports;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
