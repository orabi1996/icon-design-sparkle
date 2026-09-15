import { parseRequestConfigs, serializeRequestConfigs } from "./request-config.mjs";

export class RequestSettingsError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "RequestSettingsError";
    this.code = code;
  }
}

function rpcError(error) {
  if (error?.code === "42501") {
    return new RequestSettingsError("forbidden", "إعدادات أنواع الطلبات متاحة لمدير النظام فقط.");
  }
  if (["PGRST202", "42883"].includes(error?.code)) {
    return new RequestSettingsError("unavailable", "الحفظ الآمن غير مفعّل بعد. يلزم تطبيق ترحيل صلاحيات إعدادات الطلبات على قاعدة البيانات.");
  }
  if (error?.code === "40001") {
    return new RequestSettingsError("conflict", "تغيّرت الإعدادات بواسطة مستخدم آخر. أعد تحميل آخر نسخة قبل التعديل.");
  }
  return new RequestSettingsError("unavailable", "تعذر تأكيد العملية. أعد تحميل الإعدادات قبل المحاولة؛ لم يتم استبدالها بقيم افتراضية.");
}

export function parseRequestSettingsSnapshot(input) {
  if (!input || typeof input !== "object" || typeof input.exists !== "boolean"
    || (input.exists ? typeof input.value !== "string" : input.value !== null)) {
    throw new RequestSettingsError("invalid_data", "استجابة إعدادات الطلبات غير مكتملة؛ تم إيقاف التعديل لحماية البيانات.");
  }
  const parsed = parseRequestConfigs(input.value ?? undefined);
  // Defaults are for a confirmed missing row only, never corrupt or failed reads.
  if (input.exists && (parsed.invalidCount > 0 || parsed.source !== "saved")) {
    throw new RequestSettingsError("invalid_data", "الإعدادات المحفوظة غير سليمة. يلزم مراجعة السجل الأصلي؛ لن يتم استبداله تلقائيًا.");
  }
  return { configs: parsed.configs, expectedValue: input.value, exists: input.exists };
}

export async function loadRequestTypeSettings(rpc) {
  let result;
  try { result = await rpc("get_request_type_settings"); }
  catch { throw rpcError(null); }
  if (result.error) throw rpcError(result.error);
  return parseRequestSettingsSnapshot(result.data);
}

export async function saveRequestTypeSettings(rpc, configs, expectedValue) {
  if (expectedValue !== null && typeof expectedValue !== "string") {
    throw new RequestSettingsError("invalid_data", "يجب تحميل نسخة الإعدادات قبل الحفظ.");
  }
  const normalized = serializeRequestConfigs(configs);
  let result;
  try {
    result = await rpc("save_request_type_settings", {
      p_configs: JSON.parse(normalized), p_expected_value: expectedValue,
    });
  } catch { throw rpcError(null); }
  if (result.error) throw rpcError(result.error);
  const snapshot = parseRequestSettingsSnapshot(result.data);
  if (!snapshot.exists || serializeRequestConfigs(snapshot.configs) !== normalized) {
    throw new RequestSettingsError("invalid_data", "لم يصل تأكيد مطابق للبيانات المرسلة. أعد التحميل للتحقق من نتيجة الحفظ.");
  }
  return snapshot;
}
