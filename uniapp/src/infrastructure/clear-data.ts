import { repositories } from "./repositories";

export function clearAllLocalData(): void {
  repositories.clearAll();
}
