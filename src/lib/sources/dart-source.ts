import { disclosureEvents } from "@/data/dashboard-data";
import type { DisclosureEvent } from "@/types/dashboard";

export interface DartSource {
  getRecentDisclosures(codes?: string[]): Promise<DisclosureEvent[]>;
}

export class MockDartSource implements DartSource {
  async getRecentDisclosures(codes?: string[]): Promise<DisclosureEvent[]> {
    if (!codes || codes.length === 0) {
      return disclosureEvents;
    }

    const codeSet = new Set(codes);
    return disclosureEvents.filter((event) => codeSet.has(event.code));
  }
}

export function createDartSource(): DartSource {
  return new MockDartSource();
}
