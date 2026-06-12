import type { AppUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  footballPredictionSystemPrompt,
  footballPredictionUserPromptTemplate,
  matchSearchUserPromptTemplate,
} from "@/services/ai-prompts";

export type AiSettings = {
  provider: "mock" | "openai";
  apiBaseUrl: string;
  apiKey: string;
  apiKeySet: boolean;
  model: string;
  temperature: number;
  webSearchEnabled: boolean;
  systemPrompt: string;
  userPromptTemplate: string;
};

export type MatchSourceSettings = {
  provider: "manual" | "api" | "openai_search";
  apiUrl: string;
  searchModel: string;
  searchPromptTemplate: string;
  syncEnabled: boolean;
  syncCron: string;
};

export type RegistrationSettings = {
  enabled: boolean;
  defaultRole: "USER" | "ADVERTISER";
  disabledMessage: string;
};

export type SiteSettings = {
  siteName: string;
  siteDomain: string;
  publicBaseUrl: string;
  adminBasePath: string;
};

export type SmsSettings = {
  enabled: boolean;
  provider: "mock" | "aliyun" | "tencent" | "custom_http";
  endpointUrl: string;
  method: "POST" | "GET";
  appKey: string;
  appSecret: string;
  appSecretSet: boolean;
  sdkAppId: string;
  region: string;
  signName: string;
  templateId: string;
  loginTemplateId: string;
  registerTemplateId: string;
  resetPasswordTemplateId: string;
  headersJson: string;
  bodyTemplate: string;
  successKeyword: string;
};

export type WechatSettings = {
  enabled: boolean;
  appId: string;
  appSecret: string;
  appSecretSet: boolean;
  token: string;
  tokenSet: boolean;
  encodingAesKey: string;
  encodingAesKeySet: boolean;
  jsSdkEnabled: boolean;
  shareTitle: string;
  shareDescription: string;
  shareImageUrl: string;
};

export type AutomationSettings = {
  predictionEnabled: boolean;
  predictionRunAt: string;
  predictionLookaheadHours: number;
  predictionStatus: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED";
  prematchReanalysisEnabled: boolean;
  prematchReanalysisMinutesBefore: number;
  prematchReanalysisWindowMinutes: number;
  prematchReanalysisStatus: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED";
  reviewEnabled: boolean;
  reviewRunAt: string;
  reviewDelayHours: number;
  reviewStatus: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED";
};

export const defaultAiSettings: AiSettings = {
  provider: "mock",
  apiBaseUrl: "https://api.openai.com/v1",
  apiKey: "",
  apiKeySet: false,
  model: "gpt-5.5",
  temperature: 0.3,
  webSearchEnabled: false,
  systemPrompt: footballPredictionSystemPrompt,
  userPromptTemplate: footballPredictionUserPromptTemplate,
};

export const defaultMatchSourceSettings: MatchSourceSettings = {
  provider: "manual",
  apiUrl: "",
  searchModel: "gpt-5.5",
  searchPromptTemplate: matchSearchUserPromptTemplate,
  syncEnabled: false,
  syncCron: "每天 09:00",
};

export const defaultRegistrationSettings: RegistrationSettings = {
  enabled: true,
  defaultRole: "USER",
  disabledMessage: "当前暂未开放新用户注册，请联系管理员。",
};

export const defaultSiteSettings: SiteSettings = {
  siteName: "每日足球 AI 预测",
  siteDomain: "127.0.0.1:3000",
  publicBaseUrl: "http://127.0.0.1:3000",
  adminBasePath: "/admin",
};

export const defaultSmsSettings: SmsSettings = {
  enabled: false,
  provider: "mock",
  endpointUrl: "",
  method: "POST",
  appKey: "",
  appSecret: "",
  appSecretSet: false,
  sdkAppId: "",
  region: "ap-guangzhou",
  signName: "",
  templateId: "",
  loginTemplateId: "",
  registerTemplateId: "",
  resetPasswordTemplateId: "",
  headersJson: "{}",
  bodyTemplate: "{\"phone\":\"{{phone}}\",\"code\":\"{{code}}\"}",
  successKeyword: "",
};

export const defaultWechatSettings: WechatSettings = {
  enabled: false,
  appId: "",
  appSecret: "",
  appSecretSet: false,
  token: "",
  tokenSet: false,
  encodingAesKey: "",
  encodingAesKeySet: false,
  jsSdkEnabled: false,
  shareTitle: "每日足球 AI 预测",
  shareDescription: "今日中国体彩竞彩足球赛事、AI 数据分析和风险提示。",
  shareImageUrl: "/wechat-share-card.jpg",
};

export const defaultAutomationSettings: AutomationSettings = {
  predictionEnabled: false,
  predictionRunAt: "09:00",
  predictionLookaheadHours: 24,
  predictionStatus: "DRAFT",
  prematchReanalysisEnabled: false,
  prematchReanalysisMinutesBefore: 30,
  prematchReanalysisWindowMinutes: 10,
  prematchReanalysisStatus: "PUBLISHED",
  reviewEnabled: false,
  reviewRunAt: "10:00",
  reviewDelayHours: 2,
  reviewStatus: "DRAFT",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeAiSettings(value: unknown): AiSettings {
  if (!isRecord(value)) {
    return defaultAiSettings;
  }

  const apiKey = typeof value.apiKey === "string" ? value.apiKey : "";

  return {
    provider: value.provider === "openai" ? "openai" : "mock",
    apiBaseUrl:
      typeof value.apiBaseUrl === "string" && value.apiBaseUrl.trim()
        ? value.apiBaseUrl.trim()
        : defaultAiSettings.apiBaseUrl,
    apiKey,
    apiKeySet: apiKey.length > 0 || Boolean(process.env.OPENAI_API_KEY),
    model: typeof value.model === "string" && value.model.trim() ? value.model.trim() : defaultAiSettings.model,
    temperature: typeof value.temperature === "number" ? value.temperature : defaultAiSettings.temperature,
    webSearchEnabled: value.webSearchEnabled === true,
    systemPrompt:
      typeof value.systemPrompt === "string" && value.systemPrompt.trim()
        ? value.systemPrompt
        : defaultAiSettings.systemPrompt,
    userPromptTemplate:
      typeof value.userPromptTemplate === "string" && value.userPromptTemplate.trim()
        ? value.userPromptTemplate
        : defaultAiSettings.userPromptTemplate,
  };
}

function normalizeMatchSourceSettings(value: unknown): MatchSourceSettings {
  if (!isRecord(value)) {
    return defaultMatchSourceSettings;
  }

  const provider =
    value.provider === "api" || value.provider === "openai_search" ? value.provider : defaultMatchSourceSettings.provider;

  return {
    provider,
    apiUrl: typeof value.apiUrl === "string" ? value.apiUrl : "",
    searchModel:
      typeof value.searchModel === "string" && value.searchModel.trim()
        ? value.searchModel.trim()
        : defaultMatchSourceSettings.searchModel,
    searchPromptTemplate:
      typeof value.searchPromptTemplate === "string" && value.searchPromptTemplate.trim()
        ? value.searchPromptTemplate
        : defaultMatchSourceSettings.searchPromptTemplate,
    syncEnabled: value.syncEnabled === true,
    syncCron: typeof value.syncCron === "string" && value.syncCron.trim() ? value.syncCron : defaultMatchSourceSettings.syncCron,
  };
}

function normalizeRegistrationSettings(value: unknown): RegistrationSettings {
  if (!isRecord(value)) {
    return defaultRegistrationSettings;
  }

  return {
    enabled: value.enabled !== false,
    defaultRole: value.defaultRole === "ADVERTISER" ? "ADVERTISER" : "USER",
    disabledMessage:
      typeof value.disabledMessage === "string" && value.disabledMessage.trim()
        ? value.disabledMessage
        : defaultRegistrationSettings.disabledMessage,
  };
}

function normalizeSiteSettings(value: unknown): SiteSettings {
  if (!isRecord(value)) {
    return defaultSiteSettings;
  }

  return {
    siteName:
      typeof value.siteName === "string" && value.siteName.trim() ? value.siteName.trim() : defaultSiteSettings.siteName,
    siteDomain:
      typeof value.siteDomain === "string" && value.siteDomain.trim()
        ? value.siteDomain.trim()
        : defaultSiteSettings.siteDomain,
    publicBaseUrl:
      typeof value.publicBaseUrl === "string" && value.publicBaseUrl.trim()
        ? value.publicBaseUrl.trim().replace(/\/+$/, "")
        : defaultSiteSettings.publicBaseUrl,
    adminBasePath:
      typeof value.adminBasePath === "string" && value.adminBasePath.trim()
        ? value.adminBasePath.trim()
        : defaultSiteSettings.adminBasePath,
  };
}

function normalizeSmsSettings(value: unknown): SmsSettings {
  if (!isRecord(value)) {
    return defaultSmsSettings;
  }

  const appSecret = typeof value.appSecret === "string" ? value.appSecret : "";

  return {
    enabled: value.enabled === true,
    provider:
      value.provider === "aliyun" || value.provider === "tencent" || value.provider === "custom_http"
        ? value.provider
        : "mock",
    endpointUrl: typeof value.endpointUrl === "string" ? value.endpointUrl : "",
    method: value.method === "GET" ? "GET" : "POST",
    appKey: typeof value.appKey === "string" ? value.appKey : "",
    appSecret,
    appSecretSet: appSecret.length > 0,
    sdkAppId: typeof value.sdkAppId === "string" ? value.sdkAppId : "",
      region: typeof value.region === "string" && value.region.trim() ? value.region.trim() : defaultSmsSettings.region,
      signName: typeof value.signName === "string" ? value.signName : "",
      templateId: typeof value.templateId === "string" ? value.templateId : "",
      loginTemplateId:
        typeof value.loginTemplateId === "string" && value.loginTemplateId.trim()
          ? value.loginTemplateId.trim()
          : typeof value.templateId === "string"
            ? value.templateId
            : "",
      registerTemplateId:
        typeof value.registerTemplateId === "string" && value.registerTemplateId.trim()
          ? value.registerTemplateId.trim()
          : typeof value.templateId === "string"
            ? value.templateId
            : "",
      resetPasswordTemplateId:
        typeof value.resetPasswordTemplateId === "string" && value.resetPasswordTemplateId.trim()
          ? value.resetPasswordTemplateId.trim()
          : typeof value.templateId === "string"
            ? value.templateId
            : "",
      headersJson: typeof value.headersJson === "string" && value.headersJson.trim() ? value.headersJson : "{}",
    bodyTemplate:
      typeof value.bodyTemplate === "string" && value.bodyTemplate.trim()
        ? value.bodyTemplate
        : defaultSmsSettings.bodyTemplate,
    successKeyword: typeof value.successKeyword === "string" ? value.successKeyword : "",
  };
}

function normalizeWechatSettings(value: unknown): WechatSettings {
  if (!isRecord(value)) {
    return defaultWechatSettings;
  }

  const appSecret = typeof value.appSecret === "string" ? value.appSecret : "";
  const token = typeof value.token === "string" ? value.token : "";
  const encodingAesKey = typeof value.encodingAesKey === "string" ? value.encodingAesKey : "";

  return {
    enabled: value.enabled === true,
    appId: typeof value.appId === "string" ? value.appId : "",
    appSecret,
    appSecretSet: appSecret.length > 0,
    token,
    tokenSet: token.length > 0,
    encodingAesKey,
    encodingAesKeySet: encodingAesKey.length > 0,
    jsSdkEnabled: value.jsSdkEnabled === true,
    shareTitle:
      typeof value.shareTitle === "string" && value.shareTitle.trim()
        ? value.shareTitle
        : defaultWechatSettings.shareTitle,
    shareDescription:
      typeof value.shareDescription === "string" && value.shareDescription.trim()
        ? value.shareDescription
        : defaultWechatSettings.shareDescription,
    shareImageUrl:
      typeof value.shareImageUrl === "string" && value.shareImageUrl.trim()
        ? value.shareImageUrl
        : defaultWechatSettings.shareImageUrl,
  };
}

function normalizeAutomationSettings(value: unknown): AutomationSettings {
  if (!isRecord(value)) {
    return defaultAutomationSettings;
  }

  const predictionStatus =
    value.predictionStatus === "PENDING_REVIEW" || value.predictionStatus === "PUBLISHED"
      ? value.predictionStatus
      : "DRAFT";
  const reviewStatus =
    value.reviewStatus === "PENDING_REVIEW" || value.reviewStatus === "PUBLISHED" ? value.reviewStatus : "DRAFT";
  const prematchReanalysisStatus =
    value.prematchReanalysisStatus === "DRAFT" ||
    value.prematchReanalysisStatus === "PENDING_REVIEW" ||
    value.prematchReanalysisStatus === "PUBLISHED"
      ? value.prematchReanalysisStatus
      : defaultAutomationSettings.prematchReanalysisStatus;

  return {
    predictionEnabled: value.predictionEnabled === true,
    predictionRunAt:
      typeof value.predictionRunAt === "string" && value.predictionRunAt ? value.predictionRunAt : "09:00",
    predictionLookaheadHours:
      typeof value.predictionLookaheadHours === "number" ? value.predictionLookaheadHours : 24,
    predictionStatus,
    prematchReanalysisEnabled: value.prematchReanalysisEnabled === true,
    prematchReanalysisMinutesBefore:
      typeof value.prematchReanalysisMinutesBefore === "number"
        ? value.prematchReanalysisMinutesBefore
        : defaultAutomationSettings.prematchReanalysisMinutesBefore,
    prematchReanalysisWindowMinutes:
      typeof value.prematchReanalysisWindowMinutes === "number"
        ? value.prematchReanalysisWindowMinutes
        : defaultAutomationSettings.prematchReanalysisWindowMinutes,
    prematchReanalysisStatus,
    reviewEnabled: value.reviewEnabled === true,
    reviewRunAt: typeof value.reviewRunAt === "string" && value.reviewRunAt ? value.reviewRunAt : "10:00",
    reviewDelayHours: typeof value.reviewDelayHours === "number" ? value.reviewDelayHours : 2,
    reviewStatus,
  };
}

async function getSystemConfigValue(key: string) {
  const config = await prisma.systemConfig.findUnique({ where: { key } });
  return config?.value;
}

export async function getAiSettings() {
  return normalizeAiSettings(await getSystemConfigValue("ai_settings"));
}

export async function getAiSettingsForAdmin() {
  const settings = await getAiSettings();
  return { ...settings, apiKey: "" };
}

export async function getMatchSourceSettings() {
  return normalizeMatchSourceSettings(await getSystemConfigValue("match_source_settings"));
}

export async function getRegistrationSettings() {
  return normalizeRegistrationSettings(await getSystemConfigValue("registration_settings"));
}

export async function getSiteSettings() {
  return normalizeSiteSettings(await getSystemConfigValue("site_settings"));
}

export async function getSmsSettings() {
  return normalizeSmsSettings(await getSystemConfigValue("sms_settings"));
}

export async function getSmsSettingsForAdmin() {
  const settings = await getSmsSettings();
  return { ...settings, appSecret: "" };
}

export async function getWechatSettings() {
  return normalizeWechatSettings(await getSystemConfigValue("wechat_settings"));
}

export async function getWechatSettingsForAdmin() {
  const settings = await getWechatSettings();
  return { ...settings, appSecret: "", token: "", encodingAesKey: "" };
}

export async function getAutomationSettings() {
  return normalizeAutomationSettings(await getSystemConfigValue("automation_settings"));
}

export async function updateAiSettings(input: AiSettings & { actor: AppUser }) {
  const previous = await getAiSettings();
  const apiKey = input.apiKey.trim() || previous.apiKey || process.env.OPENAI_API_KEY || "";
  const previousAudit = { ...previous, apiKey: previous.apiKey ? "***" : "" };

  const updated = await prisma.systemConfig.upsert({
    where: { key: "ai_settings" },
    update: {
      value: {
        provider: input.provider,
        apiBaseUrl: input.apiBaseUrl,
        apiKey,
        model: input.model,
        temperature: input.temperature,
        webSearchEnabled: input.webSearchEnabled,
        systemPrompt: input.systemPrompt,
        userPromptTemplate: input.userPromptTemplate,
      },
    },
    create: {
      key: "ai_settings",
      value: {
        provider: input.provider,
        apiBaseUrl: input.apiBaseUrl,
        apiKey,
        model: input.model,
        temperature: input.temperature,
        webSearchEnabled: input.webSearchEnabled,
        systemPrompt: input.systemPrompt,
        userPromptTemplate: input.userPromptTemplate,
      },
    },
  });

  const normalized = normalizeAiSettings(updated.value);

  await prisma.auditLog.create({
    data: {
      actorId: input.actor.id,
      actorRole: input.actor.role,
      action: "UPDATE_AI_SETTINGS",
      entityType: "SystemConfig",
      entityId: updated.id,
      beforeJson: previousAudit,
      afterJson: { ...normalized, apiKey: normalized.apiKey ? "***" : "" },
    },
  });

  return { ...normalized, apiKey: "" };
}

export async function updateMatchSourceSettings(input: MatchSourceSettings & { actor: AppUser }) {
  const previous = await getMatchSourceSettings();
  const updated = await prisma.systemConfig.upsert({
    where: { key: "match_source_settings" },
    update: {
      value: {
        provider: input.provider,
        apiUrl: input.apiUrl,
        searchModel: input.searchModel,
        searchPromptTemplate: input.searchPromptTemplate,
        syncEnabled: input.syncEnabled,
        syncCron: input.syncCron,
      },
    },
    create: {
      key: "match_source_settings",
      value: {
        provider: input.provider,
        apiUrl: input.apiUrl,
        searchModel: input.searchModel,
        searchPromptTemplate: input.searchPromptTemplate,
        syncEnabled: input.syncEnabled,
        syncCron: input.syncCron,
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: input.actor.id,
      actorRole: input.actor.role,
      action: "UPDATE_MATCH_SOURCE_SETTINGS",
      entityType: "SystemConfig",
      entityId: updated.id,
      beforeJson: previous,
      afterJson: normalizeMatchSourceSettings(updated.value),
    },
  });

  return normalizeMatchSourceSettings(updated.value);
}

export async function updateRegistrationSettings(input: RegistrationSettings & { actor: AppUser }) {
  const previous = await getRegistrationSettings();
  const updated = await prisma.systemConfig.upsert({
    where: { key: "registration_settings" },
    update: {
      value: {
        enabled: input.enabled,
        defaultRole: input.defaultRole,
        disabledMessage: input.disabledMessage,
      },
    },
    create: {
      key: "registration_settings",
      value: {
        enabled: input.enabled,
        defaultRole: input.defaultRole,
        disabledMessage: input.disabledMessage,
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: input.actor.id,
      actorRole: input.actor.role,
      action: "UPDATE_REGISTRATION_SETTINGS",
      entityType: "SystemConfig",
      entityId: updated.id,
      beforeJson: previous,
      afterJson: normalizeRegistrationSettings(updated.value),
    },
  });

  return normalizeRegistrationSettings(updated.value);
}

export async function updateSiteSettings(input: SiteSettings & { actor: AppUser }) {
  const previous = await getSiteSettings();
  const value = normalizeSiteSettings(input);
  const updated = await prisma.systemConfig.upsert({
    where: { key: "site_settings" },
    update: { value },
    create: { key: "site_settings", value },
  });

  await prisma.auditLog.create({
    data: {
      actorId: input.actor.id,
      actorRole: input.actor.role,
      action: "UPDATE_SITE_SETTINGS",
      entityType: "SystemConfig",
      entityId: updated.id,
      beforeJson: previous,
      afterJson: normalizeSiteSettings(updated.value),
    },
  });

  return normalizeSiteSettings(updated.value);
}

export async function updateSmsSettings(input: SmsSettings & { actor: AppUser }) {
  const previous = await getSmsSettings();
  const appSecret = input.appSecret.trim() || previous.appSecret;
  const value = normalizeSmsSettings({ ...input, appSecret });
  const updated = await prisma.systemConfig.upsert({
    where: { key: "sms_settings" },
    update: { value },
    create: { key: "sms_settings", value },
  });

  await prisma.auditLog.create({
    data: {
      actorId: input.actor.id,
      actorRole: input.actor.role,
      action: "UPDATE_SMS_SETTINGS",
      entityType: "SystemConfig",
      entityId: updated.id,
      beforeJson: { ...previous, appSecret: previous.appSecret ? "***" : "" },
      afterJson: { ...normalizeSmsSettings(updated.value), appSecret: value.appSecret ? "***" : "" },
    },
  });

  return { ...normalizeSmsSettings(updated.value), appSecret: "" };
}

export async function updateWechatSettings(input: WechatSettings & { actor: AppUser }) {
  const previous = await getWechatSettings();
  const value = normalizeWechatSettings({
    ...input,
    appSecret: input.appSecret.trim() || previous.appSecret,
    token: input.token.trim() || previous.token,
    encodingAesKey: input.encodingAesKey.trim() || previous.encodingAesKey,
  });
  const updated = await prisma.systemConfig.upsert({
    where: { key: "wechat_settings" },
    update: { value },
    create: { key: "wechat_settings", value },
  });

  await prisma.auditLog.create({
    data: {
      actorId: input.actor.id,
      actorRole: input.actor.role,
      action: "UPDATE_WECHAT_SETTINGS",
      entityType: "SystemConfig",
      entityId: updated.id,
      beforeJson: {
        ...previous,
        appSecret: previous.appSecret ? "***" : "",
        token: previous.token ? "***" : "",
        encodingAesKey: previous.encodingAesKey ? "***" : "",
      },
      afterJson: {
        ...normalizeWechatSettings(updated.value),
        appSecret: value.appSecret ? "***" : "",
        token: value.token ? "***" : "",
        encodingAesKey: value.encodingAesKey ? "***" : "",
      },
    },
  });

  return { ...normalizeWechatSettings(updated.value), appSecret: "", token: "", encodingAesKey: "" };
}

export async function updateAutomationSettings(input: AutomationSettings & { actor: AppUser }) {
  const previous = await getAutomationSettings();
  const updated = await prisma.systemConfig.upsert({
    where: { key: "automation_settings" },
    update: { value: input },
    create: { key: "automation_settings", value: input },
  });

  await prisma.auditLog.create({
    data: {
      actorId: input.actor.id,
      actorRole: input.actor.role,
      action: "UPDATE_AUTOMATION_SETTINGS",
      entityType: "SystemConfig",
      entityId: updated.id,
      beforeJson: previous,
      afterJson: normalizeAutomationSettings(updated.value),
    },
  });

  return normalizeAutomationSettings(updated.value);
}
