import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking } from "react-native";

const STORAGE_KEY = "@bethunter_emergency_contact";

export interface EmergencyContact {
  name: string;
  /** Telefone com DDI+DDD, apenas dígitos (ex.: 5511999998888). */
  phone: string;
}

export const RESCUE_MESSAGE =
  "Estou com muita vontade de apostar e precisava de ajuda para focar em outra coisa. Pode falar?";

export async function getEmergencyContact(): Promise<EmergencyContact | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EmergencyContact>;
    if (!parsed.phone) return null;
    return { name: parsed.name ?? "", phone: parsed.phone };
  } catch {
    return null;
  }
}

export async function saveEmergencyContact(contact: EmergencyContact): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contact));
}

export async function removeEmergencyContact(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Remove tudo que não é dígito (aceita "+55 (11) 99999-8888"). */
export function sanitizePhone(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Abre o WhatsApp com a mensagem de resgate.
 * Tenta o scheme nativo e cai para o link universal wa.me.
 */
export async function openWhatsAppRescue(contact: EmergencyContact): Promise<boolean> {
  const text = encodeURIComponent(RESCUE_MESSAGE);
  const native = `whatsapp://send?phone=${contact.phone}&text=${text}`;
  const universal = `https://wa.me/${contact.phone}?text=${text}`;

  try {
    const canNative = await Linking.canOpenURL(native);
    await Linking.openURL(canNative ? native : universal);
    return true;
  } catch {
    try {
      await Linking.openURL(universal);
      return true;
    } catch {
      return false;
    }
  }
}
