export const TAG_LIMIT = 10;
export const TAG_MAX_LENGTH = 12;

/** 解析标签输入：按中英文逗号分隔，去空白、截断超长并保持顺序去重。 */
export function parseTagInput(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of raw.split(/[，,]/)) {
    const tag = part.trim().slice(0, TAG_MAX_LENGTH);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }
  return tags;
}

/** 合并已有标签与新标签，总量不超过上限；返回合并结果与因超限被拒绝的数量。 */
export function mergeTags(current: string[], parsed: string[]): { tags: string[]; added: number; rejected: number } {
  const seen = new Set(current);
  const tags = [...current];
  let added = 0;
  let rejected = 0;
  for (const tag of parsed) {
    if (tags.length >= TAG_LIMIT) {
      rejected += 1;
      continue;
    }
    if (seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
    added += 1;
  }
  return { tags, added, rejected };
}
